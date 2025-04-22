import React from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import { AuthProvider } from "./contexts/AuthContext";
import { useAuth } from "./contexts/useAuth";
import { SettingsProvider } from "./hooks/useSettings";
import { useSettings } from "./hooks/useSettingsHook";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { useEffect, memo } from "react";
import AdminPanel from "./components/AdminPanel";
import { ErrorBoundary } from "./components/ErrorBoundary";
import "./index.css";

console.log('App.tsx rendering');

// Create client with better defaults for mobile performance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 60000,
    },
  },
});

// Optimize rendering with memo
const MemoizedAdminPanel = memo(AdminPanel);

const App = () => {
  // Apply Roboto Mono font to entire app
  useEffect(() => {
    document.documentElement.style.fontFamily = "'Roboto Mono', monospace";
    // Ensure the font is loaded
    const linkEl = document.createElement('link');
    linkEl.rel = 'stylesheet';
    linkEl.href = 'https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@400;500;700&display=swap';
    document.head.appendChild(linkEl);
    // Add high-performance CSS for smooth animations
    const styleEl = document.createElement('style');
    styleEl.textContent = `
      * {
        backface-visibility: hidden;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
      }
      .animate-gpu {
        transform: translateZ(0);
        will-change: transform;
      }
      @keyframes fadeIn {
        0% { opacity: 0; }
        100% { opacity: 1; }
      }
    `;
    document.head.appendChild(styleEl);
    return () => {
      document.head.removeChild(linkEl);
      document.head.removeChild(styleEl);
    };
  }, []);

  return (
    <div className="font-sans text-foreground dark:text-white text-neutral-900">
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <SettingsProvider>
            <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
              <TooltipProvider>
                <BrowserRouter>
                  <div className="h-full min-h-screen flex flex-col bg-background text-foreground overflow-hidden font-sans dark:font-mono">
                    <ErrorBoundary>
                      <Routes>
                        <Route path="/" element={<Index />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/admin" element={<MemoizedAdminPanel />} />
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </ErrorBoundary>
                  </div>
                </BrowserRouter>
              </TooltipProvider>
            </ThemeProvider>
          </SettingsProvider>
        </AuthProvider>
      </QueryClientProvider>
      <Sonner />
      <Toaster />
    </div>
  );
};

export default App;
