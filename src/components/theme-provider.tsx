"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Theme = "dark" | "light" | "system";

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
};

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const initialState: ThemeProviderState = {
  theme: "system",
  setTheme: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

// Safe function to check if we're in a browser environment
const isBrowser = typeof window !== "undefined";

// Safe function to get item from localStorage
const getThemeFromStorage = (key: string, fallback: Theme): Theme => {
  if (!isBrowser) return fallback;
  try {
    const storedValue = localStorage.getItem(key);
    return (storedValue as Theme) || fallback;
  } catch (error) {
    console.error("Error accessing localStorage:", error);
    return fallback;
  }
};

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "ui-theme",
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(() => 
    getThemeFromStorage(storageKey, defaultTheme)
  );

  useEffect(() => {
    if (!isBrowser) return;
    
    const root = window.document.documentElement;
    
    root.classList.remove("light", "dark");

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light";

      root.classList.add(systemTheme);
      return;
    }

    root.classList.add(theme);
  }, [theme]);

  const value = {
    theme,
    setTheme: (theme: Theme) => {
      if (isBrowser) {
        try {
          localStorage.setItem(storageKey, theme);
        } catch (error) {
          console.error("Error setting theme in localStorage:", error);
        }
      }
      setTheme(theme);
    },
  };

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider");

  return context;
}; 