import { Suspense } from "react";
import { ClientHome } from "@/modules/home/components/client-home";
import { AccountPanel } from "@/modules/identity/components/account-panel";
import { muted, page } from "@/modules/ui/classes";

export default function Home() {
  return (
    <main className={page}>
      <Suspense fallback={<p className={muted}>Loading your account…</p>}>
        <AccountPanel />
      </Suspense>
      <Suspense fallback={null}>
        <ClientHome />
      </Suspense>
    </main>
  );
}
