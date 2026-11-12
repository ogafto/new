import { redirect } from "next/navigation";
import { currentUser, isAdmin } from "@/lib/auth/session";

export default async function AccountIndex() {
  const user = await currentUser();
  redirect(user?.verified_at && isAdmin(user) ? "/panel/admin" : "/konto/logowanie");
}
