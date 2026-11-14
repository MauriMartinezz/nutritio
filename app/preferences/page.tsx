import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { PreferencesForm } from "@/modules/clients/components/preferences-form";
import { getOwnPreferences } from "@/modules/clients/dal";
import { ThemeToggle } from "@/modules/theme/theme-toggle";

export const metadata: Metadata = { title: "My preferences · Nutritio" };

/** Reads the session, so it renders inside <Suspense>. */
async function OwnPreferences() {
  const preferences = await getOwnPreferences();
  return <PreferencesForm preferences={preferences} />;
}

export default function Page() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-16">
      <Link href="/" className="text-sm underline">
        ← Back
      </Link>
      <h1 className="text-2xl font-semibold">My preferences</h1>
      <ThemeToggle />
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Only the nutritionists you work with can see this.
      </p>
      <Suspense fallback={<p className="text-sm text-zinc-500">Loading…</p>}>
        <OwnPreferences />
      </Suspense>
    </main>
  );
}
