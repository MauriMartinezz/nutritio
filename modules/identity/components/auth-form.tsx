"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { useMessages } from "@/lib/i18n/client";
import { ProfileFields, inputClass } from "@/modules/nutritionists/components/profile-fields";
import { buildPhone, parseBirthDateInput } from "@/modules/nutritionists/profile";
import { buttonPrimary, card, fieldError, fieldHint, h1, label, link, muted } from "@/modules/ui/classes";
import { ButtonLabel } from "@/modules/ui/components/spinner";
import { authMessages } from "../auth-messages";

type Mode = "sign-in" | "sign-up";

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const t = useMessages(authMessages);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  // The landing links "I'm a nutritionist" to /sign-up?role=NUTRITIONIST.
  const [role, setRole] = useState<"CLIENT" | "NUTRITIONIST">(
    useSearchParams().get("role") === "NUTRITIONIST" ? "NUTRITIONIST" : "CLIENT",
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const email = String(form.get("email"));
    const password = String(form.get("password"));

    let nutritionistFields = {};
    if (mode === "sign-up" && role === "NUTRITIONIST") {
      const birthDate = parseBirthDateInput(String(form.get("birthDate")));
      if (!birthDate) {
        setError(t.invalidBirthDate);
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
        : await authClient.signIn.email({ email, password, rememberMe: form.get("rememberMe") === "on" });

    setPending(false);
    if (error) {
      setError(error.message ?? t.genericError);
      return;
    }
    // The page can stay mounted in the router's cache: never keep credentials in it.
    formElement.reset();
    router.push("/");
    router.refresh();
  }

  const isSignUp = mode === "sign-up";

  return (
    <form onSubmit={handleSubmit} className={`${card} w-full`}>
      <h1 className={h1}>{isSignUp ? t.signUpTitle : t.signInTitle}</h1>

      {isSignUp && (
        <>
          <label className={label}>
            {t.fullName}
            <input name="name" required autoComplete="name" className={inputClass} />
          </label>
          <fieldset className="flex flex-col text-sm">
            <legend className="mb-1 font-medium">{t.iAmA}</legend>
            <label className="flex min-h-11 flex-wrap items-center gap-x-2">
              <input
                type="radio"
                name="role"
                value="CLIENT"
                checked={role === "CLIENT"}
                onChange={() => setRole("CLIENT")}
                className="size-4 accent-accent"
              />{" "}
              {t.client}
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
              {t.nutritionist}
              <span className={fieldHint}>{t.requiresVerification}</span>
            </label>
          </fieldset>
          {role === "NUTRITIONIST" && <ProfileFields />}
        </>
      )}

      <label className={label}>
        {t.email}
        <input name="email" type="email" required autoComplete="email" className={inputClass} />
      </label>
      <label className={label}>
        {t.password}
        <input
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete={isSignUp ? "new-password" : "current-password"}
          className={inputClass}
        />
      </label>

      {!isSignUp && (
        <label className="flex min-h-11 items-start gap-3 text-sm">
          <input type="checkbox" name="rememberMe" className="mt-0.5 size-4 accent-accent" />
          <span className="flex flex-col gap-0.5">
            <span className="font-medium">{t.rememberMe}</span>
            <span className={fieldHint}>{t.rememberMeHint}</span>
          </span>
        </label>
      )}

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
        <ButtonLabel pending={pending} pendingText={isSignUp ? t.creatingAccount : t.signingIn}>
          {isSignUp ? t.createAccount : t.signIn}
        </ButtonLabel>
      </button>

      <p className={muted}>
        {isSignUp ? t.haveAccount : t.newHere}
        <Link href={isSignUp ? "/sign-in" : "/sign-up"} className={link}>
          {isSignUp ? t.signIn : t.createAnAccount}
        </Link>
      </p>
    </form>
  );
}
