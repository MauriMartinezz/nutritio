import { betterAuth } from "better-auth";
import { APIError } from "better-auth/api";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@/lib/prisma";
import {
  InvalidRoleError,
  NUTRITIONIST_STATUSES,
  PrivilegedFieldChangeError,
  ROLES,
  assertNoPrivilegedChanges,
  prepareNewUser,
} from "@/modules/identity/roles";

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "mysql" }),
  emailAndPassword: { enabled: true },
  telemetry: { enabled: false },
  user: {
    additionalFields: {
      // Accepted at sign-up so the person can choose CLIENT or NUTRITIONIST.
      // The database hooks below reject ADMIN and any later role change.
      role: {
        type: [...ROLES],
        required: false,
        defaultValue: "CLIENT",
        input: true,
      },
      nutritionistStatus: {
        type: [...NUTRITIONIST_STATUSES],
        required: false,
        input: false,
      },
    },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          try {
            return { data: { ...user, ...prepareNewUser({ role: user.role }) } };
          } catch (error) {
            if (error instanceof InvalidRoleError) {
              throw new APIError("BAD_REQUEST", { message: error.message });
            }
            throw error;
          }
        },
      },
      update: {
        before: async (update) => {
          try {
            assertNoPrivilegedChanges(update);
          } catch (error) {
            if (error instanceof PrivilegedFieldChangeError) {
              throw new APIError("FORBIDDEN", { message: error.message });
            }
            throw error;
          }
        },
      },
    },
  },
});
