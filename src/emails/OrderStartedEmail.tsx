import { Section, Text } from "@react-email/components";
import Layout, { c, Cta, font, Kicker, P, Title } from "./Layout";

// Po wpłacie: zlecenie wystartowało, termin liczony od dziś
export default function OrderStartedEmail({ name, title, paid, deposit, start, due, days, rest, restUrl, url, baseUrl }: { name: string; title: string; paid: string; deposit: boolean; start: string; due: string; days: number; rest: string | null; restUrl: string | null; url: string; baseUrl: string }) {
  const rows: [string, string][] = [["Wpłata", `${paid}${deposit ? " (zaliczka)" : ""}`], ["Start", start], ["Termin oddania", `${due} · ${days} dni`], ...(rest ? ([["Pozostało do zapłaty", rest]] as [string, string][]) : [])];
  return (
    <Layout preview={`Startujemy: ${title}, termin ${due}`} baseUrl={baseUrl} note="Odliczanie do terminu, pliki i wiadomości znajdziesz w panelu klienta.">
      <Kicker>Płatność przyjęta</Kicker>
      <Title>
        Dzięki, {name.split(" ")[0]}!
        <br />
        <span style={{ color: c.accent2 }}>Startujemy.</span>
      </Title>
      <P>„{title}” jest w realizacji. Termin liczy się od dzisiejszej wpłaty.</P>
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
      <Cta href={url}>Zobacz zlecenie</Cta>
      {rest && restUrl && <P>Pozostałą kwotę możesz zapłacić w dowolnym momencie przed oddaniem. Link jest w panelu.</P>}
    </Layout>
  );
}
