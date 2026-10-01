import { Section, Text } from "@react-email/components";
import Layout, { c, Cta, font, Kicker, P, Title } from "./Layout";

type Item = { title: string; client: string; service: string | null; due: string; days: number };

const when = (d: number) => (d < 0 ? `po terminie (${-d} dni)` : d === 0 ? "dziś" : d === 1 ? "jutro" : `za ${d} dni`);
const fmt = (iso: string) => new Intl.DateTimeFormat("pl-PL", { day: "numeric", month: "long" }).format(new Date(`${iso}T12:00:00`));

export default function ReminderEmail({ items, baseUrl }: { items: Item[]; baseUrl: string }) {
  return (
    <Layout preview={`${items.length} ${items.length === 1 ? "termin" : "terminy"} do pilnowania`} baseUrl={baseUrl} note="Przypomnienie z kalendarza w panelu afto.works. Zmień datę albo oznacz zlecenie jako oddane, żeby nie dostawać kolejnych.">
      <Kicker>Kalendarz</Kicker>
      <Title>
        Zbliżają się
        <br />
        <span style={{ color: c.accent2 }}>terminy.</span>
      </Title>
      <P>Oto zlecenia, którym warto się dziś przyjrzeć:</P>
      <Section style={{ marginTop: 26 }}>
        {items.map((it, i) => (
          <table key={i} cellPadding={0} cellSpacing={0} role="presentation" width="100%" style={{ marginTop: i ? 10 : 0, background: c.card2, border: `1px solid ${c.line2}`, borderRadius: 16 }}>
            <tbody>
              <tr>
                <td style={{ padding: "16px 18px" }}>
                  <Text style={{ margin: 0, fontFamily: font, fontSize: 16, color: c.ink }}>{it.title}</Text>
                  <Text style={{ margin: "4px 0 0", fontFamily: font, fontSize: 13, color: c.muted }}>
                    {it.client}
                    {it.service ? ` · ${it.service}` : ""}
                  </Text>
                </td>
                <td style={{ padding: "16px 18px", textAlign: "right", whiteSpace: "nowrap" }}>
                  <Text style={{ margin: 0, fontFamily: font, fontSize: 13, color: it.days <= 0 ? "#fca5a5" : c.accent2 }}>{when(it.days)}</Text>
                  <Text style={{ margin: "4px 0 0", fontFamily: font, fontSize: 12, color: c.dim }}>{fmt(it.due)}</Text>
                </td>
              </tr>
            </tbody>
          </table>
        ))}
      </Section>
      <Cta href={`${baseUrl}/panel/admin/kalendarz`}>Otwórz kalendarz</Cta>
    </Layout>
  );
}
