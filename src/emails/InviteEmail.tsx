import { Section, Text } from "@react-email/components";
import Layout, { c, Cta, font, Kicker, P, Title } from "./Layout";

export type InviteProps = { name?: string | null; email: string; code: string; baseUrl: string; days: number };

export default function InviteEmail({ name, email, code, baseUrl, days }: InviteProps) {
  const link = `${baseUrl}/konto/rejestracja?kod=${encodeURIComponent(code)}&email=${encodeURIComponent(email)}`;
  return (
    <Layout
      preview={`Twój kod do panelu afto.works: ${code}`}
      baseUrl={baseUrl}
      note={`Zaproszenie wysłano na ${email}. Jeśli nie spodziewasz się tej wiadomości, po prostu ją zignoruj — bez kodu nikt nie założy konta.`}
    >
      <Kicker>Zaproszenie do panelu</Kicker>
      <Title>
        {name ? `${name}, Twój` : "Twój"} panel
        <br />
        <span style={{ color: c.accent2 }}>jest gotowy.</span>
      </Title>
      <P>W panelu klienta zobaczysz postęp swojego projektu, pliki i wszystkie ustalenia w jednym miejscu. Załóż konto, używając poniższego kodu.</P>

      <Section style={{ marginTop: 30, background: c.card2, border: `1px solid ${c.line2}`, borderRadius: 18, padding: "22px 24px", textAlign: "center" }}>
        <Text style={{ margin: 0, fontFamily: font, fontSize: 12, color: c.dim, letterSpacing: 0.4 }}>Kod zaproszenia</Text>
        <Text style={{ margin: "10px 0 0", fontFamily: "'SFMono-Regular', Menlo, Consolas, monospace", fontSize: 30, lineHeight: "36px", letterSpacing: 6, color: c.ink, fontWeight: 600 }}>{code}</Text>
      </Section>

      <Cta href={link}>Załóż konto</Cta>
      <P style={{ fontSize: 13, lineHeight: "21px", color: c.dim, marginTop: 24 }}>
        Kod jest ważny {days} dni i działa tylko dla adresu {email}.
      </P>
    </Layout>
  );
}
