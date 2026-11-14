import { Suspense } from "react";
import { ClientHome } from "@/modules/home/components/client-home";
import { AccountPanel } from "@/modules/identity/components/account-panel";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-16">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold">Nutritio</h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Nutrition plans and progress tracking for nutritionists and their clients.
        </p>
      </header>
      <Suspense fallback={<p className="text-sm text-zinc-500">Loading your account…</p>}>
        <AccountPanel />
      </Suspense>
      <Suspense fallback={null}>
        <ClientHome />
      </Suspense>
    </main>
  );
}
