import { Section, Text } from "@react-email/components";
import Layout, { c, Cta, font, Kicker, P, Title } from "./Layout";

// Potwierdzenie przyjęcia zamówienia: co, od kiedy, termin oddania, ewentualna zaliczka
export default function OrderAcceptedEmail({ name, title, start, due, amount, deposit, payUrl, panelUrl, baseUrl }: { name: string; title: string; start: string; due: string; amount: string | null; deposit: string | null; payUrl: string | null; panelUrl: string; baseUrl: string }) {
  const rows: [string, string][] = [
    ["Zlecenie", title],
    ["Start", start],
    ["Termin oddania", due],
    ...(amount ? ([["Wycena", amount]] as [string, string][]) : []),
    ...(deposit ? ([["Zaliczka", deposit]] as [string, string][]) : []),
  ];
  return (
    <Layout preview={`Przyjęte: ${title}, termin ${due}`} baseUrl={baseUrl} note="Postęp i termin widzisz cały czas w panelu klienta. Masz pytania? Po prostu odpisz na tego maila.">
      <Kicker>Zamówienie przyjęte</Kicker>
      <Title>
        Cześć {name.split(" ")[0]},
        <br />
        <span style={{ color: c.accent2 }}>zaczynamy.</span>
      </Title>
      <P>Twoje zamówienie jest przyjęte i ma już termin. Poniżej szczegóły.</P>
      <Section style={{ marginTop: 22 }}>
        <table cellPadding={0} cellSpacing={0} role="presentation" width="100%" style={{ background: c.card2, border: `1px solid ${c.line2}`, borderRadius: 16 }}>
          <tbody>
            {rows.map(([k, v], i) => (
              <tr key={k}>
                <td style={{ padding: "14px 20px", borderTop: i ? `1px solid ${c.line2}` : undefined }}>
                  <Text style={{ margin: 0, fontFamily: font, fontSize: 13, color: c.muted }}>{k}</Text>
                </td>
                <td style={{ padding: "14px 20px", textAlign: "right", borderTop: i ? `1px solid ${c.line2}` : undefined }}>
                  <Text style={{ margin: 0, fontFamily: font, fontSize: 15, color: c.ink }}>{v}</Text>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>
      {payUrl && deposit ? <Cta href={payUrl}>{`Zapłać zaliczkę ${deposit}`}</Cta> : <Cta href={panelUrl}>Zobacz w panelu</Cta>}
    </Layout>
  );
}
