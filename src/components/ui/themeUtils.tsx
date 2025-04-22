import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { ThemeType } from "./themeUtils";

// Types
interface ThemeContextType {
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Deprecated: Remove custom ThemeProvider and useTheme in favor of next-themes
// export function ThemeProvider({ children }: { children: ReactNode }) {
//   const [theme, setThemeState] = useState<ThemeType>(() => {
//     const stored = localStorage.getItem("theme");
//     return stored === "dark" ? "dark" : "light";
//   });

//   useEffect(() => {
//     document.documentElement.classList.remove("light", "dark");
//     document.documentElement.classList.add(theme);
//     localStorage.setItem("theme", theme);
//   }, [theme]);

//   const setTheme = (t: ThemeType) => setThemeState(t);

//   return (
//     <ThemeContext.Provider value={{ theme, setTheme }}>
//       {children}
//     </ThemeContext.Provider>
//   );
// }

// export function useTheme() {
//   const ctx = useContext(ThemeContext);
//   if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
//   return ctx;
// }
