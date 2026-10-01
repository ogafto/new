import { ImageResponse } from "next/og";
import { site } from "@/lib/site";

export const alt = `${site.domain} — Strony internetowe, które sprzedają. Od 200 zł.`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: "radial-gradient(circle at 50% 0%, #10233a 0%, #060607 60%)",
          color: "#ededef",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 30 }}>
          <div style={{ display: "flex", width: 48, height: 48, borderRadius: 12, background: "#16161a", alignItems: "center", justifyContent: "center", gap: 4 }}>
            <div style={{ width: 14, height: 14, borderRadius: 7, background: "#ff7262" }} />
            <div style={{ width: 14, height: 14, borderRadius: 4, background: "#a259ff" }} />
          </div>
          {site.domain}
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 92, letterSpacing: -4, lineHeight: 1 }}>Strony, które</div>
          <div style={{ display: "flex", alignItems: "center", gap: 28, marginTop: 12 }}>
            <div
              style={{
                display: "flex",
                fontSize: 92,
                letterSpacing: -4,
                lineHeight: 1,
                padding: "4px 18px",
                border: "2px solid #0d99ff",
                color: "#7cc8ff",
              }}
            >
              sprzedają.
            </div>
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 28, color: "#8b8b94" }}>
          <div style={{ display: "flex" }}>Figma · Next.js · Animacje 3D</div>
          <div style={{ display: "flex", color: "#ededef" }}>od 200 zł</div>
        </div>
      </div>
    ),
    size,
  );
}
