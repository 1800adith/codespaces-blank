import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Check } from "lucide-react";

export const THEMES = [
  {
    id: "light",
    name: "Classic Light",
    preview: ["#FAF9F6", "#1C1C1E", "#F0EDE6"],
    class: "",
  },
  {
    id: "dark",
    name: "Dark Studio",
    preview: ["#111118", "#F0EDE6", "#1C1C2E"],
    class: "theme-dark",
  },
  {
    id: "sepia",
    name: "Sepia Warm",
    preview: ["#FDF6EC", "#3B2A1A", "#F5E8D0"],
    class: "theme-sepia",
  },
  {
    id: "midnight",
    name: "Midnight Blue",
    preview: ["#0A0F1E", "#E8EEFF", "#141D35"],
    class: "theme-midnight",
  },
  {
    id: "forest",
    name: "Forest Green",
    preview: ["#0F1A0F", "#E8F5E4", "#1A2E1A"],
    class: "theme-forest",
  },
  {
    id: "rose",
    name: "Rose Gold",
    preview: ["#FFF5F5", "#3D1515", "#FFE4E4"],
    class: "theme-rose",
  },
];

export function applyTheme(themeId) {
  const root = document.documentElement;
  // Remove all theme classes
  THEMES.forEach(t => { if (t.class) root.classList.remove(t.class); });

  const theme = THEMES.find(t => t.id === themeId);
  if (theme?.class) root.classList.add(theme.class);
  localStorage.setItem("gallery_theme", themeId);
}

export function initTheme() {
  const saved = localStorage.getItem("gallery_theme") || "light";
  applyTheme(saved);
  return saved;
}

export default function ThemeSelector({ open, onOpenChange, currentTheme, onThemeChange }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl">Choose Theme</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          {THEMES.map(theme => (
            <button
              key={theme.id}
              onClick={() => { onThemeChange(theme.id); }}
              className={`relative p-4 rounded-xl border-2 transition-all duration-200 text-left hover:scale-[1.02] ${
                currentTheme === theme.id
                  ? "border-primary shadow-lg"
                  : "border-border hover:border-primary/40"
              }`}
            >
              {/* Color swatches */}
              <div className="flex gap-1.5 mb-3">
                {theme.preview.map((color, i) => (
                  <div
                    key={i}
                    className="w-6 h-6 rounded-full border border-black/10"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <p className="text-sm font-medium">{theme.name}</p>
              {currentTheme === theme.id && (
                <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                  <Check className="w-3 h-3 text-primary-foreground" />
                </div>
              )}
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}