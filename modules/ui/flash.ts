// One-time notices shown as a toast after a redirect. The cookie holds only a
// key from FLASH_MESSAGES, never text, so nothing can be injected through it.

export const FLASH_COOKIE = "flash";

export const FLASH_MESSAGES = {
  "check-in-sent": "Check-in sent. Your nutritionist will see it.",
} as const;

export type FlashKey = keyof typeof FLASH_MESSAGES;

export function flashMessage(key: unknown): string | null {
  return typeof key === "string" && key in FLASH_MESSAGES ? FLASH_MESSAGES[key as FlashKey] : null;
}
