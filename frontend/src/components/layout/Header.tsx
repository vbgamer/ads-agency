import { useState } from "react";
import { motion } from "framer-motion";
import { Building2, LayoutDashboard, Crown, Menu, Home, Store, Tag } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import { useAuth } from "@/hooks/useAuth";
import { ThemeToggle } from "@/components/ThemeToggle";
import { cn } from "@/lib/utils";

export function Header() {
  const { user, userType, isLoading, profile } = useAuth();
  const isPremium = profile?.is_premium;
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { label: "Home", path: "/", icon: Home },
    { label: "Brands", path: "/brands", icon: Store },
    { label: "Offers", path: "/offers", icon: Tag },
  ];

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className={cn(
        "sticky top-0 z-50 w-full border-b backdrop-blur-xl",
        isPremium 
          ? "border-yellow-500/30 bg-gradient-to-r from-card/90 via-yellow-50/10 to-card/90 dark:via-yellow-900/5" 
          : "border-border/50 bg-card/80"
      )}
    >
      <div className="container flex h-16 items-center justify-between">
        {/* Mobile Menu Button */}
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className="md:hidden min-w-[44px] min-h-[44px]"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[280px] sm:w-[320px]">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <img 
                  src="/Adssimsim_Logo.png" 
                  alt="ADSSIMSIM Logo"
                  className={cn(
                    "h-8 w-8 rounded-lg object-contain",
                    isPremium ? "premium-glow" : "shadow-glow"
                  )}
                />
                <span className={cn(
                  "font-bold",
                  isPremium && "text-gradient-gold"
                )}>ADSSIMSIM</span>
              </SheetTitle>
            </SheetHeader>
            <nav className="mt-8 flex flex-col gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors min-h-[44px]",
                    isActive(link.path)
                      ? isPremium
                        ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                        : "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <link.icon className="h-5 w-5" />
                  {link.label}
                </Link>
              ))}
              <div className="my-4 border-t" />
              {user && userType === 'company' ? (
                <Link 
                  to="/brand/dashboard" 
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 rounded-lg bg-primary px-3 py-3 text-sm font-medium text-primary-foreground min-h-[44px]"
                >
                  <Building2 className="h-5 w-5" />
                  Brand Portal
                </Link>
              ) : user && userType === 'user' ? (
                <Link 
                  to="/user/dashboard" 
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium min-h-[44px]",
                    isPremium
                      ? "bg-gradient-premium-gold text-white"
                      : "bg-primary text-primary-foreground"
                  )}
                >
                  {isPremium && <Crown className="h-5 w-5" />}
                  <LayoutDashboard className="h-5 w-5" />
                  Dashboard
                </Link>
              ) : (
                <Link 
                  to="/login" 
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-center rounded-lg bg-primary px-3 py-3 text-sm font-medium text-primary-foreground min-h-[44px]"
                >
                  Sign In
                </Link>
              )}
            </nav>
          </SheetContent>
        </Sheet>

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <img 
            src="/Adssimsim_Logo.png" 
            alt="ADSSIMSIM Logo"
            className={cn(
              "h-10 w-10 rounded-xl object-contain transition-all",
              isPremium ? "premium-glow" : "shadow-glow"
            )}
          />
          {isPremium && (
            <Crown className="h-4 w-4 text-yellow-500 -ml-1 -mt-6" />
          )}
          <span className={cn(
            "text-xl font-bold font-sans",
            isPremium && "text-gradient-gold"
          )}>ADSSIMSIM</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-6 md:flex">
          {navLinks.map((link) => (
            <Link 
              key={link.path}
              to={link.path} 
              className={cn(
                "text-sm font-medium transition-colors hover:text-foreground",
                isPremium ? "text-yellow-700/70 dark:text-yellow-400/70 hover:text-yellow-600 dark:hover:text-yellow-300" : "text-muted-foreground"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          {isLoading ? (
            <div className="h-9 w-20 bg-muted animate-pulse rounded-md" />
          ) : user && userType === 'company' ? (
            <Link to="/brand/dashboard">
              <Button size="sm" className="gap-2">
                <Building2 className="h-4 w-4" />
                <span className="hidden sm:inline">Portal</span>
              </Button>
            </Link>
          ) : user && userType === 'user' ? (
            <Link to="/user/dashboard">
              <Button 
                size="sm" 
                className={cn(
                  "gap-2",
                  isPremium && "bg-gradient-premium-gold hover:opacity-90"
                )}
              >
                {isPremium && <Crown className="h-4 w-4" />}
                <LayoutDashboard className="h-4 w-4" />
                <span className="hidden sm:inline">Dashboard</span>
                {isPremium && (
                  <Badge variant="outline" className="ml-1 border-yellow-300/50 bg-yellow-100/50 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 text-[10px] px-1 py-0 hidden sm:flex">
                    PRO
                  </Badge>
                )}
              </Button>
            </Link>
          ) : (
            <Link to="/login">
              <Button size="sm">
                Sign In
              </Button>
            </Link>
          )}
        </div>
      </div>
    </motion.header>
  );
}
