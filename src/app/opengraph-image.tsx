import { ImageResponse } from "next/og";
import { site } from "@/lib/site";

export const alt = `${site.domain} — strony, których nie da się przewinąć obojętnie`;
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
          padding: 48,
          background: "#E6E6E3",
          backgroundImage: "radial-gradient(rgba(0,0,0,0.14) 1.5px, transparent 1.5px)",
          backgroundSize: "28px 28px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 18, color: "#77777C", marginBottom: 10 }}>
            <span>Start</span>
            <span>1440 × 840</span>
          </div>
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              background: "#0B0B0C",
              color: "#F4F4F2",
              padding: 56,
            }}
          >
            <div style={{ display: "flex", fontSize: 26 }}>{site.domain}</div>
            <div style={{ display: "flex", flexDirection: "column", fontSize: 76, letterSpacing: -3, lineHeight: 1 }}>
              <span>Strony, których nie da się</span>
              <div style={{ display: "flex", alignItems: "center", gap: 24, marginTop: 8 }}>
                <span>przewinąć</span>
                <span style={{ display: "flex", border: "3px solid #0D99FF", padding: "0 14px" }}>obojętnie.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
