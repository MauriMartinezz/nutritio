"use client";

// Feedback for form actions: a toast once each action finishes. Toasts are an
// enhancement; without JavaScript the forms still work and show their inline status.

import { useEffect, useRef, type ComponentProps } from "react";
import { useFormStatus } from "react-dom";
import { useMessages } from "@/lib/i18n/client";
import { FLASH_COOKIE, flashMessage, type FlashKey } from "../flash";
import { uiMessages } from "../messages";
import { ButtonLabel } from "./spinner";
import { notify } from "./toast";

type ToastNotice = { text: string; tone?: "success" | "error" } | null | undefined;

/**
 * Shows a toast each time a `useActionState` state changes (never for the initial state).
 * `toast` picks the text from the new state; return nothing for no toast.
 */
export function useActionToast<S>(state: S, toast: (state: S) => ToastNotice) {
  const handled = useRef(state);
  useEffect(() => {
    if (state === handled.current) return;
    handled.current = state;
    const notice = toast(state);
    if (notice) notify(notice.text, notice.tone);
  });
}

/** The flash key a Server Action left in the cookie, only when it is a known one. */
function takeFlash(): FlashKey | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${FLASH_COOKIE}=([^;]*)`));
  if (!match) return null;
  document.cookie = `${FLASH_COOKIE}=; Max-Age=0; path=/`;
  const key = decodeURIComponent(match[1]);
  return flashMessage(key) === null ? null : (key as FlashKey);
}

/**
 * Shows the notice a Server Action left with setFlash() without redirecting. It checks
 * after every render, so it also catches the refresh that follows the action, even when
 * the form that ran it is gone (e.g. a deleted row). Place it next to such forms.
 */
export function FlashNotice() {
  const t = useMessages(uiMessages);
  useEffect(() => {
    const key = takeFlash();
    if (key) notify(t.flash[key]);
  });
  return null;
}

/**
 * Submit button with a spinner while its form's action runs. With `name`/`value`, only the
 * clicked button shows the spinner; every button of the form is disabled meanwhile.
 */
export function SubmitButton({
  pendingText,
  name,
  value,
  children,
  ...props
}: Omit<ComponentProps<"button">, "disabled"> & { pendingText?: string }) {
  const { pending, data } = useFormStatus();
  const clicked = pending && (name === undefined || data?.get(name) === String(value));
  return (
    <button {...props} name={name} value={value} disabled={pending}>
      <ButtonLabel pending={clicked} pendingText={pendingText}>
        {children}
      </ButtonLabel>
    </button>
  );
}
