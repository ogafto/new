import type { MockTheme } from "@/lib/site";

// Miniaturowe makiety stron zbudowane w CSS — podmień na prawdziwe zrzuty ekranu realizacji.
const themes: Record<MockTheme, { bg: string; fg: string; accent: string; soft: string; font: string; title: string; sub: string }> = {
  coffee: { bg: "#f3ebe0", fg: "#2b1d14", accent: "#c8763a", soft: "#e4d5c3", font: "font-serif italic", title: "Kawa, która budzi miasto.", sub: "Speciality coffee · Kraków" },
  gym: { bg: "#0c0c0c", fg: "#f2f2f2", accent: "#d4ff3a", soft: "#1b1b1b", font: "font-display uppercase tracking-tighter font-bold", title: "Train harder. Get Volt.", sub: "Siłownia 24/7 · Warszawa" },
  dental: { bg: "#f6fbfb", fg: "#0f2e33", accent: "#14b8a6", soft: "#e2f3f1", font: "font-display font-semibold tracking-tight", title: "Uśmiech bez stresu.", sub: "Stomatologia · Gdańsk" },
  photo: { bg: "#111111", fg: "#eae6df", accent: "#eae6df", soft: "#1e1e1e", font: "font-serif", title: "Atelier Mira", sub: "Fotografia ślubna & portret" },
};

export default function MockSite({ theme }: { theme: MockTheme }) {
  const t = themes[theme];
  return (
    <div className="h-[180%] w-full transition-transform duration-[2.5s] ease-in-out group-hover:-translate-y-[44%]" style={{ background: t.bg, color: t.fg }}>
      {/* nav */}
      <div className="flex items-center justify-between px-[6%] py-[3.5%]">
        <span className={`text-[clamp(10px,1.4vw,15px)] ${t.font}`}>{theme === "photo" ? "AM" : t.title.split(" ")[0]}</span>
        <div className="flex items-center gap-[6%]">
          {[0, 1, 2].map((i) => (
            <span key={i} className="h-[3px] w-[clamp(14px,2.4vw,28px)] rounded-full opacity-40" style={{ background: t.fg }} />
          ))}
          <span className="h-[clamp(12px,1.8vw,20px)] w-[clamp(28px,4.5vw,52px)] rounded-full" style={{ background: t.accent }} />
        </div>
      </div>

      {/* hero */}
      {theme === "photo" ? (
        <div className="px-[6%] pt-[4%]">
          <p className={`text-[clamp(26px,6vw,72px)] leading-[0.9] ${t.font}`}>{t.title}</p>
          <p className="mt-[2%] text-[clamp(8px,1vw,12px)] tracking-[0.3em] uppercase opacity-60">{t.sub}</p>
          <div className="mt-[5%] grid grid-cols-3 gap-[2%]">
            {["#3b342c", "#6b5d4f", "#2a2622", "#8a7a68", "#4a4038", "#5d5248"].map((c, i) => (
              <div key={i} className={`rounded-sm ${i === 1 ? "row-span-2" : ""}`} style={{ background: `linear-gradient(160deg, ${c}, #0a0a0a)`, aspectRatio: i === 1 ? "auto" : "4/5" }} />
            ))}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-[1.1fr_1fr] items-center gap-[5%] px-[6%] pt-[4%]">
          <div>
            <p className="mb-[4%] text-[clamp(7px,0.9vw,11px)] tracking-[0.2em] uppercase opacity-60">{t.sub}</p>
            <p className={`text-[clamp(18px,3.6vw,46px)] leading-[0.95] ${t.font}`}>{t.title}</p>
            <div className="mt-[7%] flex gap-[4%]">
              <span className="h-[clamp(14px,2.2vw,26px)] w-[40%] rounded-full" style={{ background: t.accent }} />
              <span className="h-[clamp(14px,2.2vw,26px)] w-[30%] rounded-full border opacity-50" style={{ borderColor: t.fg }} />
            </div>
          </div>
          <div className="relative aspect-square">
            {theme === "coffee" && (
              <>
                <div className="absolute inset-[8%] rounded-full" style={{ background: t.soft }} />
                <div className="absolute inset-[22%] rounded-full" style={{ background: `radial-gradient(circle at 35% 30%, #a0643a, #3a2416)` }} />
                <div className="absolute inset-[34%] rounded-full" style={{ background: `radial-gradient(circle, #d9a77a, #8a5230)` }} />
              </>
            )}
            {theme === "gym" && (
              <>
                <div className="absolute inset-0 rounded-[20%]" style={{ background: `linear-gradient(135deg, ${t.accent}, #3aff9c)` }} />
                <div className="absolute inset-[18%] rounded-[16%] bg-black/80" />
                <p className="absolute inset-0 grid place-items-center font-display text-[clamp(18px,4vw,48px)] font-bold" style={{ color: t.accent }}>
                  24/7
                </p>
              </>
            )}
            {theme === "dental" && (
              <>
                <div className="absolute inset-0 rounded-[28%]" style={{ background: t.soft }} />
                <div className="absolute inset-[16%] rounded-full" style={{ background: `radial-gradient(circle at 40% 35%, #ffffff, ${t.accent})` }} />
                <div className="absolute right-[4%] bottom-[8%] rounded-xl bg-white px-[8%] py-[5%] text-[clamp(7px,0.9vw,11px)] shadow-lg">
                  ★ 4.9 · Rezerwuj
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* sekcja kart */}
      <div className="grid grid-cols-3 gap-[3%] px-[6%] pt-[8%]">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-[clamp(4px,0.8vw,10px)] p-[8%]" style={{ background: t.soft }}>
            <div className="mb-[18%] aspect-[4/3] rounded-[clamp(3px,0.5vw,6px)]" style={{ background: i === 1 ? t.accent : t.bg, opacity: i === 1 ? 0.9 : 0.6 }} />
            <div className="h-[4px] w-3/4 rounded-full opacity-60" style={{ background: t.fg }} />
            <div className="mt-[8%] h-[3px] w-1/2 rounded-full opacity-30" style={{ background: t.fg }} />
          </div>
        ))}
      </div>
      <div className="mx-[6%] mt-[8%] rounded-[clamp(6px,1vw,14px)] p-[6%] text-center" style={{ background: t.accent, color: theme === "gym" || theme === "photo" ? "#0b0b0b" : "#fff" }}>
        <p className={`text-[clamp(12px,2.2vw,28px)] ${t.font}`}>Zarezerwuj już dziś</p>
      </div>
    </div>
  );
}
