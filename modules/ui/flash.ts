// One-time notices shown as a toast after a redirect. The cookie holds only a
// key from FLASH_MESSAGES, never text, so nothing can be injected through it.

export const FLASH_COOKIE = "flash";

export const FLASH_MESSAGES = {
  "check-in-sent": "Check-in sent. Your nutritionist will see it.",
  "access-renewed": "Access renewed.",
  "client-accepted": "Client accepted. They can now see your plans.",
  "client-declined": "Request declined.",
  "meeting-accepted": "Meeting scheduled. The client will see the date.",
  "meeting-declined": "Meeting request declined.",
  "frequency-saved": "Check-in frequency saved.",
  "cycle-question-on": "The cycle question is now part of the check-ins.",
  "cycle-question-off": "The cycle question was removed from the check-ins.",
  "measurement-added": "Measurement added to the check-ins.",
  "measurement-removed": "Measurement removed from the check-ins.",
  "auto-renew-saved": "Auto-renew settings saved.",
  "nutritionist-requested": "Request sent. You'll see here when the nutritionist answers.",
  "activity-deleted": "Activity deleted.",
  "plan-created": "Plan created.",
  "template-created": "Template created.",
  "plan-deleted": "Plan deleted.",
  "meeting-requested": "Meeting request sent.",
  "application-sent": "Application sent. An admin will review it again.",
} as const;

export type FlashKey = keyof typeof FLASH_MESSAGES;

export function flashMessage(key: unknown): string | null {
  return typeof key === "string" && key in FLASH_MESSAGES ? FLASH_MESSAGES[key as FlashKey] : null;
}
