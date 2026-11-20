import type { Metadata } from "next";
import { pageNarrow } from "@/modules/ui/classes";
import { AuthForm } from "@/modules/identity/components/auth-form";

export const metadata: Metadata = { title: "Create account · Nutritio" };

export default function Page() {
  return (
    <main className={`${pageNarrow} max-w-md justify-center`}>
      <AuthForm mode="sign-up" />
    </main>
  );
}
