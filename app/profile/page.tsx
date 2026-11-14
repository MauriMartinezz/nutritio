import type { Metadata } from "next";
import { Suspense } from "react";
import { h1, muted, pageNarrow } from "@/modules/ui/classes";
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
    <main className={pageNarrow}>
      <div className="flex flex-col gap-2">
        <h1 className={h1}>My public profile</h1>
        <p className={muted}>Clients see this in the directory before they ask to work with you.</p>
      </div>
      <Suspense fallback={<p className={muted}>Loading…</p>}>
        <OwnPublicProfile />
      </Suspense>
    </main>
  );
}
