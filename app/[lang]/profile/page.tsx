import type { Metadata } from "next";
import { Suspense } from "react";
import { getMessages } from "@/lib/i18n/server";
import { prisma } from "@/lib/prisma";
import { PreferencesForm } from "@/modules/clients/components/preferences-form";
import { getOwnPreferences } from "@/modules/clients/dal";
import { requireUser, type CurrentUser } from "@/modules/identity/dal";
import { AccountForm } from "@/modules/identity/components/account-form";
import { ChangePasswordForm } from "@/modules/identity/components/change-password-form";
import { accountMessages } from "@/modules/identity/messages";
import { roleMessages } from "@/modules/identity/nav-messages";
import { SignOutButton } from "@/modules/identity/components/sign-out-button";
import { PublicProfileForm } from "@/modules/nutritionists/components/public-profile-form";
import { LanguageSwitcher } from "@/modules/theme/language-switcher";
import { ThemeToggle } from "@/modules/theme/theme-toggle";
import { card, h1, h2, muted, pageNarrow } from "@/modules/ui/classes";
import { SectionsSkeleton } from "@/modules/ui/components/skeleton";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getMessages(accountMessages)).profileMeta };
}

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
  const [preferences, t, roles] = await Promise.all([
    user.role === "CLIENT" ? getOwnPreferences() : null,
    getMessages(accountMessages),
    getMessages(roleMessages),
  ]);

  return (
    <>
      <Section id="account" title={t.account}>
        <div className={card}>
          <AccountForm
            name={user.name}
            email={user.email}
            role={roles[user.role]}
            sex={user.role === "CLIENT" ? (preferences?.sex ?? null) : undefined}
          />
        </div>
      </Section>

      {user.role === "CLIENT" && (
        <Section
          id="nutrition-preferences"
          title={t.nutritionPreferences}
          hint={t.nutritionPreferencesHint}
        >
          <PreferencesForm preferences={preferences} />
        </Section>
      )}

      {hasPublicProfile && (
        <Section
          id="public-profile"
          title={t.publicProfile}
          hint={t.publicProfileHint}
        >
          <PublicProfile user={user} />
        </Section>
      )}

      <Section id="password" title={t.password}>
        <div className={card}>
          <ChangePasswordForm />
        </div>
      </Section>

      <Section id="appearance" title={t.appearance}>
        <div className={card}>
          <ThemeToggle />
          <LanguageSwitcher />
        </div>
      </Section>

      <Section id="session" title={t.session}>
        <div className={card}>
          <p className={muted}>{t.signedInAs(user.email)}</p>
          <SignOutButton className="self-start" />
        </div>
      </Section>
    </>
  );
}

export default async function Page() {
  const t = await getMessages(accountMessages);
  return (
    <main className={pageNarrow}>
      <h1 className={h1}>{t.profileTitle}</h1>
      <Suspense fallback={<SectionsSkeleton />}>
        <OwnProfile />
      </Suspense>
    </main>
  );
}
