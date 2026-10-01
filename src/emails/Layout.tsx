import { Body, Container, Head, Hr, Html, Img, Link, Preview, Section, Text } from "@react-email/components";

// Wspólny wygląd maili: ciemne tło, karta z cienką ramką, fioletowy akcent — jak na stronie
export const c = {
  bg: "#07070a",
  card: "#0e0e13",
  card2: "#15151c",
  line: "#1f1e27",
  line2: "#2b2a35",
  ink: "#efedf5",
  muted: "#9b98a8",
  dim: "#615e6e",
  accent: "#8b6cff",
  accent2: "#b4a2ff",
};

export const font = "Satoshi, -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";

export function Kicker({ children }: { children: string }) {
  return (
    <table cellPadding={0} cellSpacing={0} role="presentation" style={{ marginBottom: 22 }}>
      <tbody>
        <tr>
          <td style={{ width: 28, verticalAlign: "middle" }}>
            <div style={{ height: 1, width: 28, background: c.accent, fontSize: 0, lineHeight: "1px" }}>&nbsp;</div>
          </td>
          <td style={{ paddingLeft: 12, fontFamily: font, fontSize: 13, color: c.muted, letterSpacing: 0.3 }}>{children}</td>
        </tr>
      </tbody>
    </table>
  );
}

export function Title({ children }: { children: React.ReactNode }) {
  return <Text style={{ margin: 0, fontFamily: font, fontSize: 34, lineHeight: "38px", fontWeight: 500, letterSpacing: -1.2, color: c.ink }}>{children}</Text>;
}

export function P({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <Text style={{ margin: "16px 0 0", fontFamily: font, fontSize: 16, lineHeight: "26px", color: c.muted, ...style }}>{children}</Text>;
}

export function Cta({ href, children }: { href: string; children: string }) {
  return (
    <table cellPadding={0} cellSpacing={0} role="presentation" style={{ marginTop: 32 }}>
      <tbody>
        <tr>
          <td style={{ background: c.ink, borderRadius: 999 }}>
            <Link href={href} style={{ display: "inline-block", padding: "16px 26px 16px 28px", fontFamily: font, fontSize: 15, fontWeight: 600, color: c.bg, textDecoration: "none" }}>
              {children}&nbsp;&nbsp;<span style={{ display: "inline-block", width: 26, height: 26, lineHeight: "26px", borderRadius: 999, background: c.accent, color: "#fff", textAlign: "center", fontSize: 13 }}>↗</span>
            </Link>
          </td>
        </tr>
      </tbody>
    </table>
  );
}

export default function Layout({ preview, baseUrl, children, note }: { preview: string; baseUrl: string; children: React.ReactNode; note: string }) {
  return (
    <Html lang="pl">
      <Head>
        <meta name="color-scheme" content="dark" />
        <meta name="supported-color-schemes" content="dark" />
      </Head>
      <Preview>{preview}</Preview>
      <Body style={{ margin: 0, background: c.bg, padding: "48px 12px" }}>
        <Container style={{ maxWidth: 560, margin: "0 auto" }}>
          <Section style={{ padding: "0 8px 28px" }}>
            <Link href={baseUrl}>
              <Img src={`${baseUrl}/brand/afto-logo.png`} alt="afto." height="26" style={{ height: 26, width: "auto" }} />
            </Link>
          </Section>

          <Section style={{ background: c.card, border: `1px solid ${c.line2}`, borderRadius: 24, padding: "44px 40px 40px", overflow: "hidden" }}>
            {children}
          </Section>

          <Section style={{ padding: "28px 8px 0" }}>
            <Text style={{ margin: 0, fontFamily: font, fontSize: 13, lineHeight: "21px", color: c.dim }}>{note}</Text>
            <Hr style={{ borderColor: c.line, margin: "22px 0" }} />
            <Text style={{ margin: 0, fontFamily: font, fontSize: 13, lineHeight: "21px", color: c.dim }}>
              <Link href={baseUrl} style={{ color: c.muted, textDecoration: "none" }}>
                afto.works
              </Link>
              &nbsp;·&nbsp; Strony, które wyglądają drogo. <span style={{ color: c.accent2 }}>I sprzedają.</span>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
