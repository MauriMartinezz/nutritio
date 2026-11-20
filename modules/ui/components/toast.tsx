"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useMessages } from "@/lib/i18n/client";
import { FLASH_COOKIE, flashMessage, type FlashKey } from "../flash";
import { uiMessages } from "../messages";

const VISIBLE_MS = 5000;

/** The notice's key, only when it is a known one (flashMessage validates it). */
function takeFlash(): FlashKey | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${FLASH_COOKIE}=([^;]*)`));
  if (!match) return null;
  document.cookie = `${FLASH_COOKIE}=; Max-Age=0; path=/`;
  const key = decodeURIComponent(match[1]);
  return flashMessage(key) === null ? null : (key as FlashKey);
}

/** Shows the one-time notice a Server Action left before redirecting here. */
export function Toast() {
  const pathname = usePathname();
  const t = useMessages(uiMessages);
  const [key, setKey] = useState<FlashKey | null>(null);
  const message = key ? t.flash[key] : null;

  useEffect(() => {
    // Runs after each navigation: the redirect target picks up the notice.
    const next = takeFlash();
    if (!next) return;
    const show = setTimeout(() => setKey(next), 0);
    const hide = setTimeout(() => setKey(null), VISIBLE_MS);
    return () => {
      clearTimeout(show);
      clearTimeout(hide);
    };
  }, [pathname]);

  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-4 bottom-4 z-50 flex justify-center md:inset-x-auto md:right-6 md:bottom-6">
      {message && (
        <div
          role="status"
          className="pointer-events-auto flex items-center gap-3 rounded-card border border-line bg-ink px-4 py-3 text-sm font-medium text-bg"
        >
          <span aria-hidden="true" className="flex size-5 items-center justify-center rounded-full bg-success text-xs text-bg">
            ✓
          </span>
          {message}
          <button
            type="button"
            onClick={() => setKey(null)}
            aria-label={t.dismiss}
            className="-mr-1 inline-flex min-h-8 min-w-8 items-center justify-center rounded-control text-bg/70 hover:text-bg"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}
