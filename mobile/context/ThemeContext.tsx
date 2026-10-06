import * as SecureStore from "expo-secure-store";
import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { DEFAULT_THEME_ID, getPalette, THEMES, type Palette } from "../lib/theme";

const STORAGE_KEY = "kyma_theme";

interface ThemeContextValue {
  themeId: string;
  colors: Palette;
  setTheme: (id: string) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeId, setThemeId] = useState(DEFAULT_THEME_ID);

  useEffect(() => {
    (async () => {
      try {
        const stored = await SecureStore.getItemAsync(STORAGE_KEY);
        if (stored && THEMES.some((t) => t.id === stored)) setThemeId(stored);
      } catch {
        // Keep the default — not worth failing startup over.
      }
    })();
  }, []);

  const setTheme = (id: string) => {
    const resolved = THEMES.some((t) => t.id === id) ? id : DEFAULT_THEME_ID;
    setThemeId(resolved);
    SecureStore.setItemAsync(STORAGE_KEY, resolved).catch(() => {});
  };

  return (
    <ThemeContext.Provider value={{ themeId, colors: getPalette(themeId), setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within a ThemeProvider");
  return context;
}
