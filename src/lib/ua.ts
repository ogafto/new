// Bardzo lekkie rozpoznanie urządzenia / przeglądarki / systemu z nagłówka User-Agent
export function parseUA(ua: string) {
  const device = /iPad|Tablet|Nexus 7|Nexus 10|SM-T|Kindle|Silk/i.test(ua) ? "Tablet" : /Mobi|iPhone|Android/i.test(ua) ? "Telefon" : "Komputer";
  const browser = /Edg\//.test(ua)
    ? "Edge"
    : /OPR\/|Opera/.test(ua)
      ? "Opera"
      : /SamsungBrowser/.test(ua)
        ? "Samsung"
        : /Firefox\/|FxiOS/.test(ua)
          ? "Firefox"
          : /Chrome\/|CriOS/.test(ua)
            ? "Chrome"
            : /Safari\//.test(ua)
              ? "Safari"
              : "Inna";
  const os = /iPhone|iPad|iPod/.test(ua) ? "iOS" : /Android/.test(ua) ? "Android" : /Windows/.test(ua) ? "Windows" : /Mac OS X|Macintosh/.test(ua) ? "macOS" : /Linux/.test(ua) ? "Linux" : "Inny";
  return { device, browser, os };
}

export const isBot = (ua: string) => !ua || /bot|crawl|spider|slurp|headless|lighthouse|preview|facebookexternalhit|embedly|vercel|monitor|curl|wget|python|axios|node-fetch/i.test(ua);
