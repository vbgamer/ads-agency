import { Link, useLocation } from "react-router-dom";
import { Home, Tag, Wallet, User, Building2, LogIn, Crown } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  icon: typeof Home;
  path: string;
  requiresAuth?: boolean;
}

const navItems: NavItem[] = [
  { label: "Home", icon: Home, path: "/" },
  { label: "Offers", icon: Tag, path: "/offers" },
  { label: "Wallet", icon: Wallet, path: "/wallet", requiresAuth: true },
];

export function MobileBottomNav() {
  const location = useLocation();
  const { user, userType, profile } = useAuth();
  const isPremium = profile?.is_premium;

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  // Get the profile/login item based on auth state
  const getProfileItem = (): NavItem => {
    if (!user) {
      return { label: "Login", icon: LogIn, path: "/login" };
    }
    if (userType === "company") {
      return { label: "Portal", icon: Building2, path: "/brand/dashboard" };
    }
    return { 
      label: isPremium ? "Premium" : "Account", 
      icon: isPremium ? Crown : User, 
      path: "/user/dashboard" 
    };
  };

  const allItems = [...navItems, getProfileItem()];

  return (
    <nav 
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur-lg md:hidden",
        "pb-[env(safe-area-inset-bottom)]",
        isPremium && "border-yellow-500/30 bg-gradient-to-r from-card/95 via-yellow-50/10 to-card/95 dark:via-yellow-900/10"
      )}
    >
      <div className="grid h-16 grid-cols-4">
        {allItems.map((item) => {
          // Skip wallet for non-logged in users
          if (item.requiresAuth && !user) {
            return (
              <Link
                key={item.path}
                to="/login"
                className="flex flex-col items-center justify-center gap-1 text-muted-foreground"
              >
                <item.icon className="h-5 w-5" />
                <span className="text-[10px] font-medium">Wallet</span>
              </Link>
            );
          }

          const active = isActive(item.path);

          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center justify-center gap-1 transition-colors relative min-h-[44px]",
                active
                  ? isPremium
                    ? "text-yellow-600 dark:text-yellow-400"
                    : "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {/* Active indicator */}
              {active && (
                <span 
                  className={cn(
                    "absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-8 rounded-full",
                    isPremium ? "bg-yellow-500" : "bg-primary"
                  )} 
                />
              )}
              <item.icon className={cn(
                "h-5 w-5",
                active && isPremium && "text-yellow-500"
              )} />
              <span className={cn(
                "text-[10px] font-medium",
                active && isPremium && "text-yellow-600 dark:text-yellow-400"
              )}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
