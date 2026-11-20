import { Suspense } from "react";
import { ClientHome } from "@/modules/home/components/client-home";
import { AdminHome } from "@/modules/home/components/admin-home";
import { NutritionistHome } from "@/modules/home/components/nutritionist-home";
import { AccountPanel } from "@/modules/identity/components/account-panel";
import { page } from "@/modules/ui/classes";
import { CardGridSkeleton } from "@/modules/ui/components/skeleton";

export default function Home() {
  return (
    <main className={page}>
      <Suspense fallback={<CardGridSkeleton count={3} />}>
        <AccountPanel />
      </Suspense>
      <Suspense fallback={null}>
        <ClientHome />
        <NutritionistHome />
        <AdminHome />
      </Suspense>
    </main>
  );
}
