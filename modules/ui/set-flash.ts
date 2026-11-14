import "server-only";
import { cookies } from "next/headers";
import { FLASH_COOKIE, type FlashKey } from "./flash";

/** Call from a Server Action right before redirect(); the toast reads it once. */
export async function setFlash(key: FlashKey) {
  (await cookies()).set(FLASH_COOKIE, key, { path: "/", maxAge: 60, sameSite: "lax" });
}
