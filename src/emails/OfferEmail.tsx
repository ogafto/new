import { Section, Text } from "@react-email/components";
import Layout, { c, Cta, font, Kicker, P, Title } from "./Layout";

// Wycena dla klienta: kwota, czas realizacji od wpłaty, termin płatności, zapłata całości albo zaliczki
export default function OfferEmail({ name, title, message, amount, deposit, workDays, payBy, fullUrl, depositUrl, transfer, panelUrl, baseUrl }: { name: string; title: string; message: string | null; amount: string; deposit: string | null; workDays: number; payBy: string; fullUrl: string | null; depositUrl: string | null; transfer: boolean; panelUrl: string; baseUrl: string }) {
  const rows: [string, string][] = [["Zlecenie", title], ["Kwota", amount], ...(deposit ? ([["Zaliczka na start", deposit]] as [string, string][]) : []), ["Realizacja", `${workDays} dni od wpłaty`], ["Zapłać do", payBy]];
  return (
    <Layout preview={`Wycena: ${title}, ${amount}`} baseUrl={baseUrl} note="Po wpłacie zlecenie startuje automatycznie, a termin oddania liczy się od dnia płatności. Postęp widzisz w panelu klienta.">
      <Kicker>Wycena</Kicker>
      <Title>
        Cześć {name.split(" ")[0]},
        <br />
        <span style={{ color: c.accent2 }}>oto wycena.</span>
      </Title>
      {message ? <P style={{ color: c.ink }}>{message}</P> : <P>Dzięki za zamówienie. Poniżej szczegóły. Zapłać całość albo zaliczkę, a od razu zaczynam.</P>}
      <Section style={{ marginTop: 22 }}>
        <table cellPadding={0} cellSpacing={0} role="presentation" width="100%" style={{ background: c.card2, border: `1px solid ${c.line2}`, borderRadius: 16 }}>
          <tbody>
            {rows.map(([k, v], i) => (
              <tr key={k}>
                <td style={{ padding: "14px 20px", borderTop: i ? `1px solid ${c.line2}` : undefined }}>
                  <Text style={{ margin: 0, fontFamily: font, fontSize: 13, color: c.muted }}>{k}</Text>
                </td>
                <td style={{ padding: "14px 20px", textAlign: "right", borderTop: i ? `1px solid ${c.line2}` : undefined }}>
                  <Text style={{ margin: 0, fontFamily: font, fontSize: k === "Kwota" ? 20 : 15, color: c.ink }}>{v}</Text>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>
      {fullUrl && <Cta href={fullUrl}>{`Zapłać całość: ${amount}`}</Cta>}
      {depositUrl && deposit && <Cta href={depositUrl}>{`Zapłać zaliczkę: ${deposit}`}</Cta>}
      {transfer && <P>Płatność przelewem. Dane do przelewu prześlę w odpowiedzi. Po zaksięgowaniu zlecenie wystartuje.</P>}
      <P>
        Wycenę zobaczysz też w panelu: <a href={panelUrl} style={{ color: c.accent2 }}>{panelUrl.replace(/^https?:\/\//, "")}</a>
      </P>
    </Layout>
  );
}
