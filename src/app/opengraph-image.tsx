import { ImageResponse } from "next/og";
import { site } from "@/lib/site";

export const alt = `${site.domain} — Klienci kupują oczami.`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  const line = "1px solid rgba(255,255,255,0.14)";
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#0A0A0A", color: "#EDEDE9", padding: 32, fontFamily: "sans-serif" }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", borderLeft: line, borderRight: line }}>
          <div style={{ display: "flex", justifyContent: "space-between", borderTop: line, borderBottom: line, padding: "14px 24px", fontSize: 18, color: "#8C8C87" }}>
            <span>{site.domain.toUpperCase()}</span>
            <span>STRONY · SKLEPY · BRANDING · UI/UX</span>
          </div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 24px", fontSize: 128, fontWeight: 700, lineHeight: 0.9, letterSpacing: -4 }}>
            <span>KLIENCI KUPUJĄ</span>
            <span style={{ color: "#FF5B22" }}>OCZAMI.</span>
          </div>
          <div style={{ display: "flex", borderTop: line, borderBottom: line, padding: "14px 24px", fontSize: 18, color: "#8C8C87" }}>
            Grafika komputerowa & web design — Polska
          </div>
        </div>
      </div>
    ),
    size,
  );
}
