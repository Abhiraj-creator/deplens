"use client";

import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const nextTheme = resolvedTheme === "dark" ? "light" : "dark";

  return <button type="button" onClick={() => setTheme(nextTheme)}>Use {nextTheme} theme</button>;
}
