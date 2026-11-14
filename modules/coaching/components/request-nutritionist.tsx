import { badge, buttonPrimary, muted } from "@/modules/ui/classes";
import { requestNutritionist } from "../actions";
import type { DirectoryNutritionist } from "../directory-dal";

/** The client's link status with a nutritionist, or the button to ask to work together. */
export function RequestNutritionist({ nutritionist }: { nutritionist: DirectoryNutritionist }) {
  const status = nutritionist.linkStatus;
  if (status === "ACCEPTED") return <span className={badge("success")}>Working together</span>;
  if (status === "PENDING") return <span className={badge("warning")}>Request sent</span>;

  return (
    <form action={requestNutritionist.bind(null, nutritionist.id)} className="flex flex-wrap items-center gap-3">
      {status === "REJECTED" && <span className={muted}>Previous request declined</span>}
      <button className={buttonPrimary}>{status === "REJECTED" ? "Request again" : "Request to work together"}</button>
    </form>
  );
}
