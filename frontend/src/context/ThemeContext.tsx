import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";

export interface ThemeOption {
  id: string;
  label: string;
  // [bg, element, text] — shown as swatch dots in the picker.
  swatch: [string, string, string];
}

export const THEMES: ThemeOption[] = [
  { id: "classic", label: "Classic", swatch: ["#f8fafc", "#10b891", "#0b1f1e"] },
  { id: "midnight", label: "Midnight", swatch: ["#02222e", "#53a1c9", "#dd5d42"] },
  { id: "orchard", label: "Orchard", swatch: ["#efefe2", "#004722", "#d21955"] },
  { id: "terracotta", label: "Terracotta", swatch: ["#7da288", "#482f24", "#690804"] },
  { id: "pop", label: "Pop", swatch: ["#898c87", "#f9bfc7", "#1e2901"] },
  { id: "vintage", label: "Vintage", swatch: ["#491b27", "#94791e", "#ede3cf"] },
];

const STORAGE_KEY = "agora_theme";
const DEFAULT_THEME = "midnight";

const ThemeContext = createContext<{ theme: string; setTheme: (id: string) => void } | undefined>(undefined);

const readStoredTheme = (): string => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored && THEMES.some((t) => t.id === stored) ? stored : DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
};

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<string>(readStoredTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // Private/blocked storage — theme still applies for this session.
    }
  }, [theme]);

  const setTheme = (id: string) => setThemeState(THEMES.some((t) => t.id === id) ? id : DEFAULT_THEME);

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within a ThemeProvider");
  return context;
}
