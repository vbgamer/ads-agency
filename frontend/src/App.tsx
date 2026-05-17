// Force rebuild v9 - bust browser chunk cache
import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider, setGlobalQueryClient } from "@/hooks/useAuth";
import { SplashScreen } from "@/components/SplashScreen";
import { PremiumCacheUpdater } from "@/components/PremiumCacheUpdater";
import { AnimatedRoutes } from "@/components/layout/AnimatedRoutes";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";

const queryClient = new QueryClient();

// Register queryClient globally for cache clearing on sign out
setGlobalQueryClient(queryClient);

const App = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [isPremiumSplash] = useState(() => {
    // Check cached premium status for instant premium splash
    return localStorage.getItem('isPremiumUser') === 'true';
  });

  useEffect(() => {
    // Minimum splash display time for branding visibility
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2200);

    return () => clearTimeout(timer);
  }, []);

  // Set the theme attribute on document root based on premium status
  useEffect(() => {
    const isPremium = localStorage.getItem('isPremiumUser') === 'true';
    const theme = isPremium ? 'premium' : 'free';
    document.documentElement.setAttribute('data-user-theme', theme);

    // Listen for changes in premium status
    const handleStorageChange = () => {
      const updated = localStorage.getItem('isPremiumUser') === 'true';
      const newTheme = updated ? 'premium' : 'free';
      document.documentElement.setAttribute('data-user-theme', newTheme);
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <SplashScreen isVisible={showSplash} isPremium={isPremiumSplash} />
        <AuthProvider>
          <PremiumCacheUpdater />
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <AnimatedRoutes />
            </BrowserRouter>
            <InstallPrompt />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
