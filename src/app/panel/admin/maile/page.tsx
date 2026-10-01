import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/session";
import { Card, PageHead } from "@/components/panel/ui";

export const metadata: Metadata = { title: "Szablony maili" };

const items = [
  { id: "zaproszenie", name: "Zaproszenie z kodem", text: "Wysyłany z panelu, gdy zapraszasz klienta." },
  { id: "weryfikacja", name: "Kod weryfikacyjny", text: "Wysyłany po rejestracji, żeby potwierdzić adres." },
];

export default async function EmailsPage() {
  await requireAdmin();
  return (
    <>
      <PageHead kicker="Szablony" title="Maile" />
      <div className="grid gap-5 xl:grid-cols-2">
        {items.map((m, i) => (
          <Card key={m.id} delay={i * 0.08} className="!p-0 overflow-hidden">
            <div className="flex items-center justify-between gap-4 border-b border-line p-5">
              <div>
                <p className="text-[15px]">{m.name}</p>
                <p className="text-[13px] text-dim">{m.text}</p>
              </div>
              <a href={`/panel/admin/maile/${m.id}`} target="_blank" className="rounded-full border border-line-2 px-3.5 py-1.5 text-[12.5px] transition-colors hover:border-white/40">
                Otwórz
              </a>
            </div>
            <iframe src={`/panel/admin/maile/${m.id}`} title={m.name} className="h-[760px] w-full bg-bg" />
          </Card>
        ))}
      </div>
    </>
  );
}
