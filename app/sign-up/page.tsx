import type { Metadata } from "next";
import { AuthForm } from "@/modules/identity/components/auth-form";

export const metadata: Metadata = { title: "Create account · Nutritio" };

export default function Page() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16">
      <AuthForm mode="sign-up" />
    </main>
  );
}
