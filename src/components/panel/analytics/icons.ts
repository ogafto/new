import { ICONS } from "../icons";

// Ikony urządzeń (zwykły moduł — działa też w komponentach serwerowych)
const DEVICE: Record<string, string> = {
  Komputer: "M3 5.5A1.5 1.5 0 014.5 4h15A1.5 1.5 0 0121 5.5v9a1.5 1.5 0 01-1.5 1.5h-15A1.5 1.5 0 013 14.5zM8 20h8M12 16v4",
  Telefon: "M7 4.5A1.5 1.5 0 018.5 3h7A1.5 1.5 0 0117 4.5v15a1.5 1.5 0 01-1.5 1.5h-7A1.5 1.5 0 017 19.5zM11 18h2",
  Tablet: "M5 4.5A1.5 1.5 0 016.5 3h11A1.5 1.5 0 0119 4.5v15a1.5 1.5 0 01-1.5 1.5h-11A1.5 1.5 0 015 19.5zM11 18h2",
};
export const deviceIcon = (name: string) => DEVICE[name] ?? ICONS.globe;
