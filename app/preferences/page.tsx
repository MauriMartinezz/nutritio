import type { Metadata } from "next";
import { Suspense } from "react";
import { PreferencesForm } from "@/modules/clients/components/preferences-form";
import { getOwnPreferences } from "@/modules/clients/dal";
import { ThemeToggle } from "@/modules/theme/theme-toggle";
import { card, h1, muted, pageNarrow } from "@/modules/ui/classes";

export const metadata: Metadata = { title: "My preferences · Nutritio" };

/** Reads the session, so it renders inside <Suspense>. */
async function OwnPreferences() {
  const preferences = await getOwnPreferences();
  return <PreferencesForm preferences={preferences} />;
}

export default function Page() {
  return (
    <main className={pageNarrow}>
      <h1 className={h1}>My preferences</h1>
      <div className={card}>
        <ThemeToggle />
      </div>
      <p className={muted}>Only the nutritionists you work with can see this.</p>
      <Suspense fallback={<p className={muted}>Loading…</p>}>
        <OwnPreferences />
      </Suspense>
    </main>
  );
}
