"use client";

import { useMessages } from "@/lib/i18n/client";
import { defineMessages } from "@/lib/i18n/messages";

const messages = defineMessages({ en: { loading: "Loading…" }, es: { loading: "Cargando…" } });

/** Screen-reader text for skeletons, in the active language. */
export function LoadingLabel() {
  return <span className="sr-only">{useMessages(messages).loading}</span>;
}
