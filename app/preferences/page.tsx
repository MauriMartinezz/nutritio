import { redirect } from "next/navigation";

/** Preferences now live on the profile page; keeps old links working. */
export default function Page() {
  redirect("/profile");
}
