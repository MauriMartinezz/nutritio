import type { Metadata } from "next";
import { Suspense } from "react";
import { SectionsSkeleton } from "@/modules/ui/components/skeleton";
import { pageNarrow } from "@/modules/ui/classes";
import { getMessages } from "@/lib/i18n/server";
import { authMessages } from "@/modules/identity/auth-messages";
import { AuthForm } from "@/modules/identity/components/auth-form";
import { Brand } from "@/modules/identity/components/app-nav";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getMessages(authMessages)).signUpMeta };
}

export default function Page() {
  return (
    <main className={`${pageNarrow} max-w-md justify-center`}>
      <Brand />
      <Suspense fallback={<SectionsSkeleton sections={1} fields={3} />}>
        <AuthForm mode="sign-up" />
      </Suspense>
    </main>
  );
}
