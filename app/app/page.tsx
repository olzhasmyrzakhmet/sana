import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { allClientPackMetas } from "@/lib/semantic/registry";
import { Workspace } from "@/components/workspace/Workspace";

export const dynamic = "force-dynamic";

export default async function AppPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return <Workspace user={user} packs={allClientPackMetas()} />;
}
