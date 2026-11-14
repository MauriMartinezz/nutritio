import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/modules/identity/dal";
import { PublicProfileForm } from "@/modules/nutritionists/components/public-profile-form";

export const metadata: Metadata = { title: "My public profile · Nutritio" };

/** Reads the session, so it renders inside <Suspense>. */
async function OwnPublicProfile() {
  const nutritionist = await requireRole("NUTRITIONIST");
  const profile = await prisma.user.findUniqueOrThrow({
    where: { id: nutritionist.id },
    select: {
      bio: true,
      education: true,
      planIncludes: true,
      feeAmount: true,
      feeCurrency: true,
      feeDescription: true,
    },
  });

  return (
    <PublicProfileForm
      profile={{ ...profile, feeAmount: profile.feeAmount?.toString() ?? null }}
    />
  );
}

export default function Page() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-16">
      <Link href="/" className="text-sm underline">
        ← Back
      </Link>
      <h1 className="text-2xl font-semibold">My public profile</h1>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Clients see this in the directory before they ask to work with you.
      </p>
      <Suspense fallback={<p className="text-sm text-zinc-500">Loading…</p>}>
        <OwnPublicProfile />
      </Suspense>
    </main>
  );
}
