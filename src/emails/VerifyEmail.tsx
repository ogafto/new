import { Section } from "@react-email/components";
import Layout, { c, font, Kicker, P, Title } from "./Layout";

export type VerifyProps = { name: string; code: string; baseUrl: string; minutes: number };

export default function VerifyEmail({ name, code, baseUrl, minutes }: VerifyProps) {
  return (
    <Layout
      preview={`Kod weryfikacyjny: ${code}`}
      baseUrl={baseUrl}
      note="Nie zakładasz konta w afto.works? Zignoruj tę wiadomość — bez kodu adres nie zostanie potwierdzony."
    >
      <Kicker>Weryfikacja adresu</Kicker>
      <Title>
        Cześć {name.split(" ")[0]},
        <br />
        <span style={{ color: c.accent2 }}>to Twój kod.</span>
      </Title>
      <P>Wpisz go na stronie, żeby potwierdzić adres e-mail i dokończyć zakładanie konta.</P>

      <Section style={{ marginTop: 30 }}>
        <table cellPadding={0} cellSpacing={0} role="presentation" style={{ margin: "0 auto" }}>
          <tbody>
            <tr>
              {code.split("").map((d, i) => (
                <td key={i} style={{ paddingLeft: i === 0 ? 0 : i === 3 ? 14 : 6 }}>
                  <div
                    style={{
                      width: 48,
                      height: 60,
                      lineHeight: "60px",
                      textAlign: "center",
                      background: c.card2,
                      border: `1px solid ${c.line2}`,
                      borderRadius: 14,
                      fontFamily: font,
                      fontSize: 28,
                      fontWeight: 600,
                      color: c.ink,
                    }}
                  >
                    {d}
                  </div>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </Section>

      <P style={{ fontSize: 13, lineHeight: "21px", color: c.dim, marginTop: 28, textAlign: "center" }}>Kod wygasa za {minutes} minut.</P>
    </Layout>
  );
}
