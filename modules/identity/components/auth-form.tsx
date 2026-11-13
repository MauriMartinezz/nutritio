"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

type Mode = "sign-in" | "sign-up";

const inputClass =
  "w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900";

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);

    const form = new FormData(event.currentTarget);
    const email = String(form.get("email"));
    const password = String(form.get("password"));

    const { error } =
      mode === "sign-up"
        ? await authClient.signUp.email({
            name: String(form.get("name")),
            email,
            password,
            role: form.get("role") === "NUTRITIONIST" ? "NUTRITIONIST" : "CLIENT",
          })
        : await authClient.signIn.email({ email, password });

    setPending(false);
    if (error) {
      setError(error.message ?? "Something went wrong. Please try again.");
      return;
    }
    router.push("/");
    router.refresh();
  }

  const isSignUp = mode === "sign-up";

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-4">
      <h1 className="text-2xl font-semibold">{isSignUp ? "Create your account" : "Sign in"}</h1>

      {isSignUp && (
        <>
          <label className="flex flex-col gap-1 text-sm">
            Full name
            <input name="name" required autoComplete="name" className={inputClass} />
          </label>
          <fieldset className="flex flex-col gap-2 text-sm">
            <legend className="mb-1">I am a…</legend>
            <label className="flex items-center gap-2">
              <input type="radio" name="role" value="CLIENT" defaultChecked /> Client
            </label>
            <label className="flex items-center gap-2">
              <input type="radio" name="role" value="NUTRITIONIST" /> Nutritionist
              <span className="text-zinc-500">(requires admin verification)</span>
            </label>
          </fieldset>
        </>
      )}

      <label className="flex flex-col gap-1 text-sm">
        Email
        <input name="email" type="email" required autoComplete="email" className={inputClass} />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Password
        <input
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete={isSignUp ? "new-password" : "current-password"}
          className={inputClass}
        />
      </label>

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
      >
        {pending ? "Please wait…" : isSignUp ? "Create account" : "Sign in"}
      </button>

      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        {isSignUp ? "Already have an account? " : "New here? "}
        <Link href={isSignUp ? "/sign-in" : "/sign-up"} className="underline">
          {isSignUp ? "Sign in" : "Create an account"}
        </Link>
      </p>
    </form>
  );
}
