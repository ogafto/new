import { Section, Text } from "@react-email/components";
import Layout, { c, Cta, font, Kicker, P, Title } from "./Layout";

// Powiadomienie dla admina: klient zapłacił
export default function PaidEmail({ client, title, amount, method, email, baseUrl, started }: { client: string; title: string; amount: string; method: string; email: string | null; baseUrl: string; started?: { order: string; due: string; deposit: boolean } | null }) {
  return (
    <Layout preview={`${client} zapłacił(a) ${amount}`} baseUrl={baseUrl} note="Powiadomienie z panelu afto.works — płatność została automatycznie oznaczona jako opłacona.">
      <Kicker>{started ? "Zamówienie opłacone" : "Nowa wpłata"}</Kicker>
      <Title>
        Wpłynęło
        <br />
        <span style={{ color: "#6ee7b7" }}>{amount}.</span>
      </Title>
      <P>
        {client} właśnie opłacił(a) {started ? (started.deposit ? "zaliczkę" : "całość") : "płatność"} ({method}).
        {started ? ` Zlecenie wystartowało — termin oddania: ${started.due}.` : ""}
      </P>
      <Section style={{ marginTop: 22 }}>
        <table cellPadding={0} cellSpacing={0} role="presentation" width="100%" style={{ background: c.card2, border: `1px solid ${c.line2}`, borderRadius: 16 }}>
          <tbody>
            <tr>
              <td style={{ padding: "18px 20px" }}>
                <Text style={{ margin: 0, fontFamily: font, fontSize: 16, color: c.ink }}>{title}</Text>
                <Text style={{ margin: "4px 0 0", fontFamily: font, fontSize: 13, color: c.muted }}>
                  {client}
                  {email ? ` · ${email}` : ""}
                </Text>
              </td>
              <td style={{ padding: "18px 20px", textAlign: "right", whiteSpace: "nowrap" }}>
                <Text style={{ margin: 0, fontFamily: font, fontSize: 20, color: "#6ee7b7" }}>{amount}</Text>
              </td>
            </tr>
          </tbody>
        </table>
      </Section>
      <Cta href={started ? `${baseUrl}/panel/admin/zlecenia/${started.order}` : `${baseUrl}/panel/admin/finanse`}>{started ? "Otwórz zlecenie" : "Otwórz finanse"}</Cta>
    </Layout>
  );
}
