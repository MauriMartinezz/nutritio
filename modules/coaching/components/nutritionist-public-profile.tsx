import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { card, h1, h2, muted } from "@/modules/ui/classes";
import { getDirectoryProfile } from "../directory-dal";
import { FeeBox, NutritionistFacts } from "./nutritionist-facts";
import { RequestNutritionist } from "./request-nutritionist";
import { PlansWithNutritionist } from "@/modules/plans/components/plans-with-nutritionist";

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className={card}>
      <h2 className={h2}>{title}</h2>
      <p className="whitespace-pre-line text-sm text-ink">{children}</p>
    </section>
  );
}

/** A verified nutritionist's full public profile, for clients. Render inside <Suspense>. */
export async function NutritionistPublicProfile({ params }: { params: Promise<{ nutritionistId: string }> }) {
  const { nutritionistId } = await params;
  const nutritionist = await getDirectoryProfile(nutritionistId);
  if (!nutritionist) notFound();

  const empty = !nutritionist.bio && !nutritionist.education && !nutritionist.planIncludes;

  return (
    <div className="flex flex-col gap-6">
      <div className={card}>
        <div className="flex flex-col gap-1.5">
          <h1 className={h1}>{nutritionist.name}</h1>
          <NutritionistFacts nutritionist={nutritionist} />
        </div>
        {nutritionist.fee && <FeeBox fee={nutritionist.fee} />}
        <div className="border-t border-divider pt-4">
          <RequestNutritionist nutritionist={nutritionist} />
        </div>
      </div>

      {nutritionist.linkStatus === "ACCEPTED" && (
        <PlansWithNutritionist nutritionistId={nutritionist.id} nutritionistName={nutritionist.name} />
      )}

      {nutritionist.bio && <Section title="About">{nutritionist.bio}</Section>}
      {nutritionist.planIncludes && <Section title="What the plan includes">{nutritionist.planIncludes}</Section>}
      {nutritionist.education && <Section title="Education">{nutritionist.education}</Section>}
      {empty && <p className={muted}>This nutritionist hasn&apos;t filled in their public profile yet.</p>}
    </div>
  );
}
