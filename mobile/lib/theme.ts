// Mirrors the web app's theme system (frontend/src/index.css's @theme and
// [data-theme="..."] blocks) 1:1 — same six named palettes, same token
// names (minus the CSS custom-property dashes), so picking a theme here
// means the same thing it means on the web app.
export interface Palette {
  agora: string;
  agoraOn: string;
  agoraHover: string;
  agoraLight: string;
  agoraDark: string;
  agoraText: string;
  agoraMuted: string;
  agoraDim: string;
  agoraBg: string;
  agoraSurface: string;
  agoraBorder: string;
}

export interface ThemeOption {
  id: string;
  label: string;
  swatch: [string, string, string]; // [bg, accent, text] — for the picker's swatch dots
  palette: Palette;
}

export const THEMES: ThemeOption[] = [
  {
    id: "classic",
    label: "Classic",
    swatch: ["#f8fafc", "#10b891", "#0b1f1e"],
    palette: {
      agora: "#10b891",
      agoraOn: "#ffffff",
      agoraHover: "#3bc5a5",
      agoraLight: "#dee2e4",
      agoraDark: "#707071",
      agoraText: "#0b1f1e",
      agoraMuted: "#697676",
      agoraDim: "#899394",
      agoraBg: "#f8fafc",
      agoraSurface: "#eceff1",
      agoraBorder: "#c9ced0",
    },
  },
  {
    id: "midnight",
    label: "Midnight",
    swatch: ["#02222e", "#53a1c9", "#dd5d42"],
    palette: {
      agora: "#53a1c9",
      agoraOn: "#ffffff",
      agoraHover: "#72b2d3",
      agoraLight: "#1a2930",
      agoraDark: "#01161e",
      agoraText: "#dd5d42",
      agoraMuted: "#d95c41",
      agoraDim: "#a74f3d",
      agoraBg: "#02222e",
      agoraSurface: "#0d252f",
      agoraBorder: "#2e2e32",
    },
  },
  {
    id: "orchard",
    label: "Orchard",
    swatch: ["#efefe2", "#004722", "#d21955"],
    palette: {
      agora: "#004722",
      agoraOn: "#ffffff",
      agoraHover: "#2e684a",
      agoraLight: "#ecd7d2",
      agoraDark: "#6c6c66",
      agoraText: "#d21955",
      agoraMuted: "#d31d57",
      agoraDim: "#dc6084",
      agoraBg: "#efefe2",
      agoraSurface: "#eee4db",
      agoraBorder: "#e9c4c6",
    },
  },
  {
    id: "terracotta",
    label: "Terracotta",
    swatch: ["#7da288", "#482f24", "#690804"],
    palette: {
      agora: "#482f24",
      agoraOn: "#ffffff",
      agoraHover: "#69544b",
      agoraLight: "#7b9179",
      agoraDark: "#516958",
      agoraText: "#690804",
      agoraMuted: "#690b06",
      agoraDim: "#704033",
      agoraBg: "#7da288",
      agoraSurface: "#7c9a81",
      agoraBorder: "#79836e",
    },
  },
  {
    id: "pop",
    label: "Pop",
    swatch: ["#898c87", "#f9bfc7", "#1e2901"],
    palette: {
      agora: "#f9bfc7",
      agoraOn: "#111111",
      agoraHover: "#d4a2a9",
      agoraLight: "#7d8178",
      agoraDark: "#595b58",
      agoraText: "#1e2901",
      agoraMuted: "#202b04",
      agoraDim: "#3c4426",
      agoraBg: "#898c87",
      agoraSurface: "#848780",
      agoraBorder: "#74786c",
    },
  },
  {
    id: "vintage",
    label: "Vintage",
    swatch: ["#491b27", "#94791e", "#ede3cf"],
    palette: {
      agora: "#94791e",
      agoraOn: "#ffffff",
      agoraHover: "#a79146",
      agoraLight: "#5b3139",
      agoraDark: "#2f1219",
      agoraText: "#ede3cf",
      agoraMuted: "#a58b85",
      agoraDim: "#8b6b6a",
      agoraBg: "#491b27",
      agoraSurface: "#51252f",
      agoraBorder: "#6a4349",
    },
  },
];

export const DEFAULT_THEME_ID = "midnight";

export const getPalette = (id: string): Palette =>
  (THEMES.find((t) => t.id === id) ?? THEMES.find((t) => t.id === DEFAULT_THEME_ID)!).palette;

export const fonts = {
  body: "Wellfleet_400Regular",
} as const;
