import { Prisma } from "@/generated/prisma/client";

/**
 * Name of the unique index (or target fields) a P2002 error violated, or null.
 * With the Prisma 7 driver adapters, `meta.target` is absent and the index lives
 * at `meta.driverAdapterError.cause.constraint.index`.
 */
export function uniqueViolationIndex(error: unknown): string | null {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") return null;
  const meta = (error.meta ?? {}) as {
    target?: unknown;
    driverAdapterError?: { cause?: { constraint?: { index?: unknown; fields?: unknown } } };
  };
  const constraint = meta.driverAdapterError?.cause?.constraint;
  const found = constraint?.index ?? constraint?.fields ?? meta.target;
  if (found == null) return "";
  return Array.isArray(found) ? found.join(",") : String(found);
}
