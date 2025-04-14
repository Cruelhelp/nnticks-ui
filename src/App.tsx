
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import { AuthProvider } from "./contexts/AuthContext";
import { SettingsProvider } from "./hooks/useSettings";
import { ThemeProvider } from "./components/ui/theme-provider";
import { useEffect, memo } from "react";
import AdminPanel from "./components/AdminPanel";
import "./index.css";

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
        from { opacity: 0; }
        to { opacity: 1; }
      }
      
      .fade-in {
        animation: fadeIn 0.3s ease-out forwards;
      }
    `;
    document.head.appendChild(styleEl);
    
    return () => {
      document.head.removeChild(linkEl);
      document.head.removeChild(styleEl);
    };
  }, []);
  
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SettingsProvider>
          <ThemeProvider defaultTheme="dark" attribute="class">
            <TooltipProvider>
              <BrowserRouter>
                <div className="h-full min-h-screen flex flex-col bg-background text-foreground overflow-hidden font-mono">
                  <Toaster />
                  <Sonner />
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/admin" element={<MemoizedAdminPanel />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </div>
              </BrowserRouter>
            </TooltipProvider>
          </ThemeProvider>
        </SettingsProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
