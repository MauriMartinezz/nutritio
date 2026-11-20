import type { Metadata } from "next";
import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { PreferencesForm } from "@/modules/clients/components/preferences-form";
import { getOwnPreferences } from "@/modules/clients/dal";
import { requireUser, type CurrentUser } from "@/modules/identity/dal";
import { AccountForm } from "@/modules/identity/components/account-form";
import { ChangePasswordForm } from "@/modules/identity/components/change-password-form";
import { SignOutButton } from "@/modules/identity/components/sign-out-button";
import { PublicProfileForm } from "@/modules/nutritionists/components/public-profile-form";
import { ThemeToggle } from "@/modules/theme/theme-toggle";
import { card, h1, h2, muted, pageNarrow } from "@/modules/ui/classes";

export const metadata: Metadata = { title: "Profile · Nutritio" };

const ROLE_LABELS = {
  ADMIN: "Administrator",
  NUTRITIONIST: "Nutritionist",
  CLIENT: "Client",
} as const;

function Section({ id, title, hint, children }: { id: string; title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <h2 id={id} className={h2}>
          {title}
        </h2>
        {hint && <p className={muted}>{hint}</p>}
      </div>
      {children}
    </section>
  );
}

async function PublicProfile({ user }: { user: CurrentUser }) {
  const profile = await prisma.user.findUniqueOrThrow({
    where: { id: user.id },
    select: {
      bio: true,
      education: true,
      planIncludes: true,
      feeAmount: true,
      feeCurrency: true,
      feeDescription: true,
    },
  });
  return <PublicProfileForm profile={{ ...profile, feeAmount: profile.feeAmount?.toString() ?? null }} />;
}

/** Reads the session, so it renders inside <Suspense>. */
async function OwnProfile() {
  const user = await requireUser();
  const hasPublicProfile =
    user.role === "NUTRITIONIST" && (user.nutritionistStatus === "APPROVED" || user.nutritionistStatus === "PENDING");
  const preferences = user.role === "CLIENT" ? await getOwnPreferences() : null;

  return (
    <>
      <Section id="account" title="Account">
        <div className={card}>
          <AccountForm
            name={user.name}
            email={user.email}
            role={ROLE_LABELS[user.role]}
            sex={user.role === "CLIENT" ? (preferences?.sex ?? null) : undefined}
          />
        </div>
      </Section>

      {user.role === "CLIENT" && (
        <Section
          id="nutrition-preferences"
          title="Nutrition preferences"
          hint="Only the nutritionists you work with can see this."
        >
          <PreferencesForm preferences={preferences} />
        </Section>
      )}

      {hasPublicProfile && (
        <Section
          id="public-profile"
          title="Public profile"
          hint="Clients see this in the directory before they ask to work with you."
        >
          <PublicProfile user={user} />
        </Section>
      )}

      <Section id="password" title="Password">
        <div className={card}>
          <ChangePasswordForm />
        </div>
      </Section>

      <Section id="appearance" title="Appearance">
        <div className={card}>
          <ThemeToggle />
        </div>
      </Section>

      <Section id="session" title="Session">
        <div className={card}>
          <p className={muted}>Signed in as {user.email}.</p>
          <SignOutButton className="self-start" />
        </div>
      </Section>
    </>
  );
}

export default function Page() {
  return (
    <main className={pageNarrow}>
      <h1 className={h1}>Profile</h1>
      <Suspense fallback={<p className={muted}>Loading…</p>}>
        <OwnProfile />
      </Suspense>
    </main>
  );
}
