import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/modules/identity/dal";
import { EditNutritionistForm } from "./edit-nutritionist-form";

/** Admin-only. Reads the session and route params, so render it inside <Suspense>. */
export async function NutritionistEditor({ params }: { params: Promise<{ id: string }> }) {
  await requireRole("ADMIN");
  const { id } = await params;

  const nutritionist = await prisma.user.findFirst({
    where: { id, role: "NUTRITIONIST" },
    select: {
      id: true,
      name: true,
      email: true,
      nutritionistStatus: true,
      dni: true,
      licenseNumber: true,
      birthDate: true,
      phone: true,
      specialty: true,
    },
  });
  if (!nutritionist) notFound();

  const { nutritionistStatus, birthDate, ...rest } = nutritionist;

  return (
    <EditNutritionistForm
      nutritionist={{
        ...rest,
        status: nutritionistStatus ?? "PENDING",
        birthDate: birthDate ? birthDate.toISOString().slice(0, 10) : null,
      }}
    />
  );
}
