import { betterAuth } from "better-auth";
import { APIError } from "better-auth/api";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { localeFromHeaders } from "@/lib/i18n/negotiate";
import { prisma } from "@/lib/prisma";
import { InvalidDisplayNameError, normalizeNameUpdate } from "@/modules/identity/account";
import { nutritionistErrors } from "@/modules/nutritionists/messages";
import { InvalidProfileError } from "@/modules/nutritionists/profile";
import {
  InvalidRoleError,
  NUTRITIONIST_STATUSES,
  UnexpectedProfileError,
  PrivilegedFieldChangeError,
  ROLES,
  assertNoPrivilegedChanges,
  prepareNewUser,
} from "@/modules/identity/roles";

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
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
      // Nutritionist profile: accepted only at sign-up (validated in the create
      // hook); the update hook rejects any later change through the auth API.
      dni: { type: "string", required: false, input: true },
      licenseNumber: { type: "string", required: false, input: true },
      birthDate: { type: "date", required: false, input: true },
      phone: { type: "string", required: false, input: true },
      specialty: { type: "string", required: false, input: true },
    },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user, ctx) => {
          // /api/auth bypasses proxy.ts, so read the language from the request itself.
          const locale = localeFromHeaders(ctx?.headers);
          let prepared;
          try {
            prepared = prepareNewUser(user, new Date(), locale);
          } catch (error) {
            if (
              error instanceof InvalidRoleError ||
              error instanceof InvalidProfileError ||
              error instanceof UnexpectedProfileError
            ) {
              throw new APIError("BAD_REQUEST", { message: error.message });
            }
            throw error;
          }
          if ("dni" in prepared) {
            const taken = await prisma.user.findUnique({ where: { dni: prepared.dni } });
            if (taken) throw new APIError("BAD_REQUEST", { message: nutritionistErrors[locale].dniTaken });
          }
          return { data: { ...user, ...prepared } };
        },
      },
      update: {
        before: async (update, ctx) => {
          try {
            assertNoPrivilegedChanges(update);
          } catch (error) {
            if (error instanceof PrivilegedFieldChangeError) {
              throw new APIError("FORBIDDEN", { message: error.message });
            }
            throw error;
          }
          // Name edits from the profile page go through updateUser.
          try {
            return normalizeNameUpdate(update, localeFromHeaders(ctx?.headers));
          } catch (error) {
            if (error instanceof InvalidDisplayNameError) {
              throw new APIError("BAD_REQUEST", { message: error.message });
            }
            throw error;
          }
        },
      },
    },
  },
});
