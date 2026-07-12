import { getPack, isPackId, clientPackMeta } from "@/lib/semantic/registry";
import { EmbedWidget } from "@/components/widget/EmbedWidget";

export const dynamic = "force-dynamic";
export const metadata = { title: "SANA — виджет" };

export default async function EmbedPage({
  searchParams,
}: {
  searchParams: Promise<{ pack?: string }>;
}) {
  const sp = await searchParams;
  const packId = sp.pack && isPackId(sp.pack) ? sp.pack : "auto";
  return <EmbedWidget pack={clientPackMeta(getPack(packId))} />;
}
