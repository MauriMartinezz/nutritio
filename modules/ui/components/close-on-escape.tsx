"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Escape navigates to `href` (closes a URL-driven panel). */
export function CloseOnEscape({ href }: { href: string }) {
  const router = useRouter();
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") router.push(href, { scroll: false });
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [href, router]);
  return null;
}
