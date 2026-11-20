"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { ProfileFields, inputClass } from "@/modules/nutritionists/components/profile-fields";
import { buildPhone, parseBirthDateInput } from "@/modules/nutritionists/profile";
import { buttonPrimary, card, fieldError, fieldHint, h1, label, link, muted } from "@/modules/ui/classes";

type Mode = "sign-in" | "sign-up";

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [role, setRole] = useState<"CLIENT" | "NUTRITIONIST">("CLIENT");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const form = new FormData(event.currentTarget);
    const email = String(form.get("email"));
    const password = String(form.get("password"));

    let nutritionistFields = {};
    if (mode === "sign-up" && role === "NUTRITIONIST") {
      const birthDate = parseBirthDateInput(String(form.get("birthDate")));
      if (!birthDate) {
        setError("Date of birth must be a real date as dd/mm/yyyy.");
        return;
      }
      const phone = buildPhone(String(form.get("phonePrefix")), String(form.get("phoneNumber")));
      if ("error" in phone) {
        setError(`${phone.error}.`);
        return;
      }
      nutritionistFields = {
        dni: String(form.get("dni")),
        licenseNumber: String(form.get("licenseNumber")),
        birthDate,
        phone: phone.phone,
        specialty: String(form.get("specialty")),
      };
    }

    setPending(true);

    const { error } =
      mode === "sign-up"
        ? await authClient.signUp.email({
            name: String(form.get("name")),
            email,
            password,
            role,
            ...nutritionistFields,
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
    <form onSubmit={handleSubmit} className={`${card} w-full`}>
      <h1 className={h1}>{isSignUp ? "Create your account" : "Sign in"}</h1>

      {isSignUp && (
        <>
          <label className={label}>
            Full name
            <input name="name" required autoComplete="name" className={inputClass} />
          </label>
          <fieldset className="flex flex-col text-sm">
            <legend className="mb-1 font-medium">I am a…</legend>
            <label className="flex min-h-11 flex-wrap items-center gap-x-2">
              <input
                type="radio"
                name="role"
                value="CLIENT"
                checked={role === "CLIENT"}
                onChange={() => setRole("CLIENT")}
                className="size-4 accent-accent"
              />{" "}
              Client
            </label>
            <label className="flex min-h-11 flex-wrap items-center gap-x-2">
              <input
                type="radio"
                name="role"
                value="NUTRITIONIST"
                checked={role === "NUTRITIONIST"}
                onChange={() => setRole("NUTRITIONIST")}
                className="size-4 accent-accent"
              />{" "}
              Nutritionist
              <span className={fieldHint}>(requires admin verification)</span>
            </label>
          </fieldset>
          {role === "NUTRITIONIST" && <ProfileFields />}
        </>
      )}

      <label className={label}>
        Email
        <input name="email" type="email" required autoComplete="email" className={inputClass} />
      </label>
      <label className={label}>
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
        <p role="alert" className={fieldError}>
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className={buttonPrimary}
      >
        {pending ? "Please wait…" : isSignUp ? "Create account" : "Sign in"}
      </button>

      <p className={muted}>
        {isSignUp ? "Already have an account? " : "New here? "}
        <Link href={isSignUp ? "/sign-in" : "/sign-up"} className={link}>
          {isSignUp ? "Sign in" : "Create an account"}
        </Link>
      </p>
    </form>
  );
}
