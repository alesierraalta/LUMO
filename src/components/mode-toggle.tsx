"use client";

import { useTheme } from "@/components/theme-provider";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export function ModeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Only show the toggle after mounting to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="relative">
        <button
          className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-input bg-background p-2 text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          title="Toggle theme"
        >
          <Sun className="h-5 w-5" />
          <span className="sr-only">Toggle theme</span>
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-input bg-background p-2 text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
        onClick={() => setTheme(theme === "light" ? "dark" : "light")}
        title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
      >
        <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
        <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        <span className="sr-only">Toggle theme</span>
      </button>
    </div>
  );
} 