import Link from "next/link";
import { buttonLink, card, h3, muted } from "@/modules/ui/classes";
import { getDirectory } from "../directory-dal";
import { FeeBox, NutritionistFacts } from "./nutritionist-facts";
import { RequestNutritionist } from "./request-nutritionist";

/** Approved nutritionists a client can work with, as summary cards. Render inside <Suspense>. */
export async function NutritionistDirectory() {
  const nutritionists = await getDirectory();

  if (nutritionists.length === 0) {
    return <p className={muted}>There are no verified nutritionists yet.</p>;
  }

  return (
    <ul className="grid gap-4 md:grid-cols-2">
      {nutritionists.map((nutritionist) => (
        <li key={nutritionist.id} className={`${card} justify-between`}>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <Link href={`/nutritionists/${nutritionist.id}`} className={`${h3} hover:text-accent`}>
                {nutritionist.name}
              </Link>
              <NutritionistFacts nutritionist={nutritionist} />
            </div>
            {nutritionist.bio && <p className="line-clamp-3 text-sm text-ink">{nutritionist.bio}</p>}
            {nutritionist.fee && <FeeBox fee={nutritionist.fee} />}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-divider pt-4">
            <Link href={`/nutritionists/${nutritionist.id}`} className={buttonLink}>
              View profile
            </Link>
            <RequestNutritionist nutritionist={nutritionist} />
          </div>
        </li>
      ))}
    </ul>
  );
}
