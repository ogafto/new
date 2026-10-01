import { ImageResponse } from "next/og";
import { BRAND, MARK, toSvg } from "@/lib/logo";
import { site } from "@/lib/site";

export const alt = `${site.domain} — strony, które wyglądają drogo i sprzedają`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  const mark = `data:image/svg+xml;base64,${Buffer.from(toSvg(MARK)).toString("base64")}`;
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: BRAND.black, color: BRAND.ink, padding: 72, fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          {/* eslint-disable-next-line jsx-a11y/alt-text */}
          <img src={mark} width={72} height={72} />
          <span style={{ fontSize: 28, color: "#A1A1A6" }}>{site.role}</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", fontSize: 88, lineHeight: 1, letterSpacing: -3 }}>
          <span>Strony, które wyglądają drogo.</span>
          <span style={{ color: "#A1A1A6" }}>
            I&nbsp;<span style={{ color: BRAND.ink, borderBottom: `8px solid ${BRAND.accent}` }}>sprzedają.</span>
          </span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 26, color: "#A1A1A6" }}>
          <span>Strony · Sklepy · Identyfikacja · UI/UX</span>
          <span style={{ color: BRAND.ink }}>{site.domain}</span>
        </div>
      </div>
    ),
    size,
  );
}
