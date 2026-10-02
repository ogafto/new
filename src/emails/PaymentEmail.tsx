import { Section, Text } from "@react-email/components";
import Layout, { c, Cta, font, Kicker, P, Title } from "./Layout";

export default function PaymentEmail({ name, title, amount, due, url, baseUrl }: { name: string; title: string; amount: string; due: string | null; url: string; baseUrl: string }) {
  return (
    <Layout preview={`${title} — ${amount}`} baseUrl={baseUrl} note="Płatność obsługuje Stripe — możesz zapłacić kartą, BLIK-iem albo szybkim przelewem. Potwierdzenie przyjdzie automatycznie.">
      <Kicker>Płatność</Kicker>
      <Title>
        Cześć {name.split(" ")[0]},
        <br />
        <span style={{ color: c.accent2 }}>link do płatności.</span>
      </Title>
      <P>Poniżej szczegóły — kliknij przycisk, żeby zapłacić bezpiecznie online.</P>
      <Section style={{ marginTop: 22 }}>
        <table cellPadding={0} cellSpacing={0} role="presentation" width="100%" style={{ background: c.card2, border: `1px solid ${c.line2}`, borderRadius: 16 }}>
          <tbody>
            <tr>
              <td style={{ padding: "18px 20px" }}>
                <Text style={{ margin: 0, fontFamily: font, fontSize: 16, color: c.ink }}>{title}</Text>
                {due && <Text style={{ margin: "4px 0 0", fontFamily: font, fontSize: 13, color: c.muted }}>Termin: {due}</Text>}
              </td>
              <td style={{ padding: "18px 20px", textAlign: "right", whiteSpace: "nowrap" }}>
                <Text style={{ margin: 0, fontFamily: font, fontSize: 22, color: c.ink }}>{amount}</Text>
              </td>
            </tr>
          </tbody>
        </table>
      </Section>
      <Cta href={url}>{`Zapłać ${amount}`}</Cta>
    </Layout>
  );
}
