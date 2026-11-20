"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useMessages } from "@/lib/i18n/client";
import { FLASH_COOKIE, flashMessage, type FlashKey } from "../flash";
import { uiMessages } from "../messages";

const VISIBLE_MS = 5000;
const TOAST_EVENT = "nutritio:toast";

type Notice = { text: string; tone: "success" | "error"; id: number };

/**
 * Shows a toast from a Client Component (e.g. after a form action succeeds without
 * redirecting). Pass text that is already translated.
 */
export function notify(text: string, tone: Notice["tone"] = "success") {
  window.dispatchEvent(new CustomEvent<Omit<Notice, "id">>(TOAST_EVENT, { detail: { text, tone } }));
}

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
  const [notice, setNotice] = useState<Notice | null>(null);
  const message = notice?.text ?? null;

  useEffect(() => {
    // Runs after each navigation: the redirect target picks up the notice.
    const next = takeFlash();
    if (!next) return;
    const show = setTimeout(() => setNotice({ text: t.flash[next], tone: "success", id: Date.now() }), 0);
    return () => clearTimeout(show);
  }, [pathname, t]);

  useEffect(() => {
    function onNotice(event: Event) {
      const { text, tone } = (event as CustomEvent<Omit<Notice, "id">>).detail;
      setNotice({ text, tone, id: Date.now() });
    }
    window.addEventListener(TOAST_EVENT, onNotice);
    return () => window.removeEventListener(TOAST_EVENT, onNotice);
  }, []);

  useEffect(() => {
    // Each new notice gets its own full display time.
    if (!notice) return;
    const hide = setTimeout(() => setNotice(null), VISIBLE_MS);
    return () => clearTimeout(hide);
  }, [notice]);

  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-4 bottom-4 z-50 flex justify-center md:inset-x-auto md:right-6 md:bottom-6">
      {message && (
        <div
          role="status"
          className="pointer-events-auto flex items-center gap-3 rounded-card border border-line bg-ink px-4 py-3 text-sm font-medium text-bg"
        >
          <span
            aria-hidden="true"
            className={`flex size-5 items-center justify-center rounded-full text-xs text-bg ${
              notice?.tone === "error" ? "bg-danger" : "bg-success"
            }`}
          >
            {notice?.tone === "error" ? "!" : "✓"}
          </span>
          {message}
          <button
            type="button"
            onClick={() => setNotice(null)}
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
