import { useEffect, useState } from "react";

export type Theme = "light" | "dark" | "system";
const KEY = "agrovest.theme";

function applyTheme(t: Theme) {
  const root = document.documentElement;
  const isDark = t === "dark" || (t === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  root.classList.toggle("dark", isDark);
}

export function getStoredTheme(): Theme {
  if (typeof window === "undefined") return "system";
  return (localStorage.getItem(KEY) as Theme) || "system";
}

export function setStoredTheme(t: Theme) {
  localStorage.setItem(KEY, t);
  applyTheme(t);
}

export function initTheme() {
  if (typeof window === "undefined") return;
  applyTheme(getStoredTheme());
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  mq.addEventListener("change", () => {
    if (getStoredTheme() === "system") applyTheme("system");
  });
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => getStoredTheme());
  useEffect(() => { applyTheme(theme); }, [theme]);
  return {
    theme,
    setTheme: (t: Theme) => { setStoredTheme(t); setTheme(t); },
  };
}
