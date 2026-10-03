import Layout, { c, Cta, Kicker, P, Title } from "./Layout";

// Zlecenie oddane — pliki do pobrania w panelu
export default function OrderDoneEmail({ name, title, files, note, url, baseUrl }: { name: string; title: string; files: number; note: string | null; url: string; baseUrl: string }) {
  return (
    <Layout preview={`Gotowe: ${title}`} baseUrl={baseUrl} note="Pliki zostają w panelu — możesz je pobrać w każdej chwili.">
      <Kicker>Zlecenie oddane</Kicker>
      <Title>
        Cześć {name.split(" ")[0]},
        <br />
        <span style={{ color: c.accent2 }}>gotowe.</span>
      </Title>
      <P>
        „{title}” jest skończone.{files ? ` W panelu czeka ${files} ${files === 1 ? "plik" : files < 5 ? "pliki" : "plików"} do pobrania.` : ""}
      </P>
      {note && <P style={{ color: c.ink }}>{note}</P>}
      <Cta href={url}>Otwórz zlecenie</Cta>
    </Layout>
  );
}
