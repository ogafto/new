import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth/session";

export default async function AccountIndex() {
  const user = await currentUser();
  if (!user) redirect("/konto/logowanie");
  if (!user.verified_at) redirect("/konto/weryfikacja");
  redirect(user.role === "admin" ? "/panel/admin" : "/panel");
}
