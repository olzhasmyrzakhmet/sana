import Script from "next/script";
import { LegacyDashboard } from "@/components/legacy/LegacyDashboard";
import { ConnectSnippet } from "@/components/legacy/ConnectSnippet";

export const dynamic = "force-dynamic";
export const metadata = { title: "Kaz-Analytics BI + SANA" };

export default function LegacyBiPage() {
  return (
    <div className="sana-light">
      <LegacyDashboard />
      <section style={{ background: "#eef2f6" }}>
        <div className="mx-auto max-w-6xl px-4 pb-24">
          <ConnectSnippet />
        </div>
      </section>
      {/* Реальная одна строка подключения виджета SANA поверх «чужой» BI */}
      <Script src="/widget.js" data-pack="auto" strategy="afterInteractive" />
    </div>
  );
}
