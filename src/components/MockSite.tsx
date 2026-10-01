import type { MockTheme } from "@/lib/site";

/*
 * Makiety realizacji zbudowane w CSS (jednostki cqw = skalują się z kontenerem).
 * Gdy masz prawdziwe zrzuty ekranu, ustaw `image` w projekcie — makieta zniknie.
 * Rodzic powinien mieć klasę `group/mock`, wtedy po najechaniu "strona się przewija".
 */

const scroll = "h-[180%] w-full transition-transform duration-[3s] ease-in-out group-hover/mock:-translate-y-[44%]";

const sites = {
  coffee: { bg: "#f3ebe0", fg: "#2b1d14", accent: "#c8763a", soft: "#e4d5c3", font: "font-serif italic", logo: "Ziarno", title: "Kawa, która budzi miasto.", sub: "Speciality coffee · Kraków" },
  gym: { bg: "#0c0c0c", fg: "#f2f2f2", accent: "#d4ff3a", soft: "#1b1b1b", font: "font-display uppercase tracking-tighter font-bold", logo: "VOLT", title: "Train harder. Get Volt.", sub: "Siłownia 24/7 · Warszawa" },
  dental: { bg: "#f6fbfb", fg: "#0f2e33", accent: "#14b8a6", soft: "#e2f3f1", font: "font-display font-semibold tracking-tight", logo: "Nova", title: "Uśmiech bez stresu.", sub: "Stomatologia · Gdańsk" },
  photo: { bg: "#111111", fg: "#eae6df", accent: "#eae6df", soft: "#1e1e1e", font: "font-serif", logo: "AM", title: "Atelier Mira", sub: "Fotografia ślubna & portret" },
};

function Website({ theme }: { theme: keyof typeof sites }) {
  const t = sites[theme];
  return (
    <div className={scroll} style={{ background: t.bg, color: t.fg }}>
      <div className="flex items-center justify-between px-[6%] py-[3.5%]">
        <span className={`text-[3cqw] ${t.font}`}>{t.logo}</span>
        <div className="flex items-center gap-[6%]">
          {[0, 1, 2].map((i) => (
            <span key={i} className="h-[0.5cqw] w-[5.3cqw] rounded-full opacity-40" style={{ background: t.fg }} />
          ))}
          <span className="h-[4cqw] w-[10cqw] rounded-full" style={{ background: t.accent }} />
        </div>
      </div>

      {theme === "photo" ? (
        <div className="px-[6%] pt-[4%]">
          <p className={`text-[13cqw] leading-[0.9] ${t.font}`}>{t.title}</p>
          <p className="mt-[2%] text-[2.2cqw] tracking-[0.3em] uppercase opacity-60">{t.sub}</p>
          <div className="mt-[5%] grid grid-cols-3 gap-[2%]">
            {["#3b342c", "#6b5d4f", "#2a2622", "#8a7a68", "#4a4038", "#5d5248"].map((c, i) => (
              <div key={i} className={`rounded-sm ${i === 1 ? "row-span-2" : ""}`} style={{ background: `linear-gradient(160deg, ${c}, #0a0a0a)`, aspectRatio: i === 1 ? "auto" : "4/5" }} />
            ))}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-[1.1fr_1fr] items-center gap-[5%] px-[6%] pt-[4%]">
          <div>
            <p className="mb-[4%] text-[2cqw] tracking-[0.2em] uppercase opacity-60">{t.sub}</p>
            <p className={`text-[7.9cqw] leading-[0.95] ${t.font}`}>{t.title}</p>
            <div className="mt-[7%] flex gap-[4%]">
              <span className="h-[4.8cqw] w-[40%] rounded-full" style={{ background: t.accent }} />
              <span className="h-[4.8cqw] w-[30%] rounded-full border opacity-50" style={{ borderColor: t.fg }} />
            </div>
          </div>
          <div className="relative aspect-square">
            {theme === "coffee" && (
              <>
                <div className="absolute inset-[8%] rounded-full" style={{ background: t.soft }} />
                <div className="absolute inset-[22%] rounded-full" style={{ background: "radial-gradient(circle at 35% 30%, #a0643a, #3a2416)" }} />
                <div className="absolute inset-[34%] rounded-full" style={{ background: "radial-gradient(circle, #d9a77a, #8a5230)" }} />
              </>
            )}
            {theme === "gym" && (
              <>
                <div className="absolute inset-0 rounded-[20%]" style={{ background: `linear-gradient(135deg, ${t.accent}, #3aff9c)` }} />
                <div className="absolute inset-[18%] rounded-[16%] bg-black/80" />
                <p className="absolute inset-0 grid place-items-center font-display text-[8.8cqw] font-bold" style={{ color: t.accent }}>
                  24/7
                </p>
              </>
            )}
            {theme === "dental" && (
              <>
                <div className="absolute inset-0 rounded-[28%]" style={{ background: t.soft }} />
                <div className="absolute inset-[16%] rounded-full" style={{ background: `radial-gradient(circle at 40% 35%, #ffffff, ${t.accent})` }} />
                <div className="absolute right-[4%] bottom-[8%] rounded-xl bg-white px-[8%] py-[5%] text-[2cqw] shadow-lg">★ 4.9 · Rezerwuj</div>
              </>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-[3%] px-[6%] pt-[8%]">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-[1.8cqw] p-[8%]" style={{ background: t.soft }}>
            <div className="mb-[18%] aspect-[4/3] rounded-[1.1cqw]" style={{ background: i === 1 ? t.accent : t.bg, opacity: i === 1 ? 0.9 : 0.6 }} />
            <div className="h-[0.7cqw] w-3/4 rounded-full opacity-60" style={{ background: t.fg }} />
            <div className="mt-[8%] h-[0.5cqw] w-1/2 rounded-full opacity-30" style={{ background: t.fg }} />
          </div>
        ))}
      </div>
      <div className="mx-[6%] mt-[8%] rounded-[2.2cqw] p-[6%] text-center" style={{ background: t.accent, color: theme === "gym" || theme === "photo" ? "#0b0b0b" : "#fff" }}>
        <p className={`text-[4.8cqw] ${t.font}`}>Zarezerwuj już dziś</p>
      </div>
    </div>
  );
}

function Shop() {
  const items = ["#d9d3c7", "#b4502e", "#2a2a2a", "#e8e2d6", "#8c8576", "#cfc6b6"];
  return (
    <div className={scroll} style={{ background: "#f4f1ec", color: "#111" }}>
      <div className="flex items-center justify-between border-b border-black/10 px-[5%] py-[3%]">
        <span className="font-display text-[3cqw] font-bold tracking-tight uppercase">Forma</span>
        <span className="flex gap-[3cqw] text-[1.8cqw] opacity-60">
          <span>Nowości</span>
          <span>Kobiety</span>
          <span>Mężczyźni</span>
        </span>
        <span className="text-[1.8cqw]">Koszyk (2)</span>
      </div>
      <div className="grid grid-cols-[1.2fr_1fr] gap-[3%] px-[5%] pt-[4%]">
        <div className="relative aspect-[4/5] rounded-[1cqw]" style={{ background: "linear-gradient(160deg,#d9d3c7,#b9b0a0)" }}>
          <span className="absolute bottom-[5%] left-[6%] font-display text-[6cqw] leading-[0.9] font-bold text-white uppercase">
            Kolekcja
            <br />
            Jesień
          </span>
        </div>
        <div className="flex flex-col justify-end">
          <p className="text-[2cqw] uppercase opacity-60">Nowość · 349 zł</p>
          <p className="mt-[3%] font-display text-[5cqw] leading-[0.95] font-bold uppercase">Płaszcz Wełniany</p>
          <div className="mt-[6%] flex gap-[2%]">
            {["S", "M", "L"].map((s) => (
              <span key={s} className="grid size-[5cqw] place-items-center border border-black/30 text-[1.8cqw]">
                {s}
              </span>
            ))}
          </div>
          <span className="mt-[6%] grid h-[6cqw] place-items-center bg-[#111] text-[2cqw] text-white uppercase">Dodaj do koszyka</span>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-[2%] px-[5%] pt-[6%]">
        {items.map((c, i) => (
          <div key={i}>
            <div className="aspect-[3/4] rounded-[0.6cqw]" style={{ background: c }} />
            <div className="mt-[6%] flex justify-between text-[1.7cqw]">
              <span>Produkt {i + 1}</span>
              <span className="opacity-60">{159 + i * 40} zł</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Brand() {
  return (
    <div className={scroll} style={{ background: "#1d2b24", color: "#e8e2d0" }}>
      <div className="grid h-[42%] place-items-center">
        <div className="text-center">
          <svg viewBox="0 0 100 60" className="mx-auto w-[22cqw]" fill="none" stroke="#c9822b" strokeWidth="3">
            <path d="M5 55 L35 12 L50 32 L62 18 L95 55" />
            <path d="M28 40 Q50 30 72 40" />
          </svg>
          <p className="mt-[3cqw] font-display text-[9cqw] leading-none font-bold tracking-[0.12em] uppercase">Halny</p>
          <p className="mt-[1.5cqw] text-[1.9cqw] tracking-[0.4em] uppercase opacity-60">Browar rzemieślniczy</p>
        </div>
      </div>
      <div className="grid grid-cols-4">
        {["#1D2B24", "#E8E2D0", "#C9822B", "#7A9A84"].map((c) => (
          <div key={c} className="flex aspect-square flex-col justify-end p-[8%] text-[1.6cqw]" style={{ background: c, color: c === "#E8E2D0" ? "#1d2b24" : "#e8e2d0" }}>
            {c}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-[3%] p-[5%]">
        {["#c9822b", "#7a9a84", "#e8e2d0"].map((c, i) => (
          <div key={c} className="flex aspect-[2/3] flex-col items-center justify-center rounded-[1.5cqw]" style={{ background: c, color: i === 2 ? "#1d2b24" : "#1d2b24" }}>
            <svg viewBox="0 0 100 60" className="w-[10cqw]" fill="none" stroke="currentColor" strokeWidth="4">
              <path d="M5 55 L35 12 L50 32 L62 18 L95 55" />
            </svg>
            <p className="mt-[8%] font-display text-[2.6cqw] font-bold uppercase">{["IPA", "Lager", "Stout"][i]}</p>
          </div>
        ))}
      </div>
      <div className="mx-[5%] flex items-center justify-between rounded-[1cqw] bg-[#e8e2d0] p-[5%] text-[#1d2b24]">
        <span className="font-display text-[4cqw] font-bold uppercase">Halny</span>
        <span className="text-right text-[1.7cqw] opacity-70">
          Jan Kowalski
          <br />
          Piwowar
        </span>
      </div>
    </div>
  );
}

function Ui() {
  return (
    <div className={`${scroll} p-[4%]`} style={{ background: "#0e1116", color: "#e9edf5" }}>
      <div className="grid h-[52%] grid-cols-[18%_1fr] gap-[3%]">
        <div className="rounded-[1.4cqw] bg-white/[0.04] p-[12%]">
          <p className="font-display text-[2.8cqw] font-bold">Pulse</p>
          {["Pulpit", "Treningi", "Postępy", "Plan"].map((x, i) => (
            <p key={x} className={`mt-[18%] rounded-[0.8cqw] px-[10%] py-[6%] text-[1.6cqw] ${i === 0 ? "bg-[#5b8cff] text-white" : "opacity-50"}`}>
              {x}
            </p>
          ))}
        </div>
        <div className="grid grid-rows-[auto_1fr] gap-[4%]">
          <div className="grid grid-cols-3 gap-[3%]">
            {[
              ["Kalorie", "2 340"],
              ["Kroki", "11 208"],
              ["Tętno", "72"],
            ].map(([k, v], i) => (
              <div key={k} className="rounded-[1.4cqw] bg-white/[0.04] p-[8%]">
                <p className="text-[1.5cqw] opacity-50">{k}</p>
                <p className="mt-[6%] font-display text-[4cqw] font-bold" style={{ color: i === 2 ? "#ff6b6b" : undefined }}>
                  {v}
                </p>
              </div>
            ))}
          </div>
          <div className="relative rounded-[1.4cqw] bg-white/[0.04] p-[4%]">
            <p className="text-[1.6cqw] opacity-50">Aktywność · 7 dni</p>
            <div className="absolute inset-x-[4%] bottom-[10%] flex h-[60%] items-end gap-[3%]">
              {[40, 65, 50, 80, 55, 92, 70].map((h, i) => (
                <span key={i} className="flex-1 rounded-t-[0.6cqw]" style={{ height: `${h}%`, background: i === 5 ? "#5b8cff" : "rgba(255,255,255,0.12)" }} />
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="mt-[4%] flex justify-center gap-[4%]">
        {[0, 1, 2].map((i) => (
          <div key={i} className="aspect-[9/19] w-[22%] rounded-[2.4cqw] border border-white/15 bg-[#151a22] p-[2%]">
            <div className="h-[30%] rounded-[1.6cqw]" style={{ background: i === 1 ? "#5b8cff" : "rgba(255,255,255,0.06)" }} />
            <div className="mt-[10%] h-[3%] w-2/3 rounded-full bg-white/20" />
            <div className="mt-[6%] h-[3%] w-1/2 rounded-full bg-white/10" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function MockSite({ theme }: { theme: MockTheme }) {
  if (theme === "shop") return <Shop />;
  if (theme === "brand") return <Brand />;
  if (theme === "ui") return <Ui />;
  return <Website theme={theme} />;
}
