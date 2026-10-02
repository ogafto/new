import Layout, { c, Kicker, P, Title } from "./Layout";

export default function TestEmail({ baseUrl }: { baseUrl: string }) {
  return (
    <Layout preview="Wysyłka maili z panelu działa" baseUrl={baseUrl} note="Wiadomość testowa z Panel → Ustawienia → E-mail.">
      <Kicker>Test</Kicker>
      <Title>
        Wysyłka
        <br />
        <span style={{ color: c.accent2 }}>działa.</span>
      </Title>
      <P>Jeśli to czytasz, klucz Resend i adres nadawcy są ustawione poprawnie. Zaproszenia, kody weryfikacyjne, przypomnienia i linki do płatności będą dochodzić.</P>
    </Layout>
  );
}
