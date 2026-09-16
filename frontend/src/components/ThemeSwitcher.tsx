import { useState } from "react";
import { THEMES, useTheme } from "../context/ThemeContext";
import { PaletteIcon } from "./icons";

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex h-9 w-9 items-center justify-center rounded-full text-agora-muted hover:bg-white/5"
        aria-label="Choose theme"
        title="Choose theme"
      >
        <PaletteIcon className="h-5 w-5" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-2xl border border-agora-border bg-agora-surface/95 shadow-lg shadow-black/30 backdrop-blur-xl">
            <p className="border-b border-agora-border px-4 py-2 text-xs font-semibold tracking-wide text-agora-dim uppercase">
              Theme
            </p>
            <div className="flex flex-col py-1">
              {THEMES.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => {
                    setTheme(option.id);
                    setOpen(false);
                  }}
                  className={`flex items-center gap-3 px-4 py-2 text-left text-sm hover:bg-white/5 ${
                    theme === option.id ? "text-agora-text" : "text-agora-muted"
                  }`}
                >
                  <span className="flex shrink-0 -space-x-1.5">
                    {option.swatch.map((color, i) => (
                      <span
                        key={i}
                        className="h-4 w-4 rounded-full border border-agora-border"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </span>
                  {option.label}
                  {theme === option.id && <span className="ml-auto text-agora">✓</span>}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
