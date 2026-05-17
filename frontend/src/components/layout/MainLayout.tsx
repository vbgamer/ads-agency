import { Header } from "./Header";
import { Footer } from "./Footer";
import { MobileBottomNav } from "./MobileBottomNav";
import { PremiumSparkles } from "@/components/premium/PremiumSparkles";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

interface MainLayoutProps {
  children: React.ReactNode;
  showFooter?: boolean;
}

export function MainLayout({ children, showFooter = true }: MainLayoutProps) {
  const { profile } = useAuth();
  // PREVIEW MODE: Force premium theme for preview (remove this line to restore normal behavior)
  const isPremium = true; // profile?.is_premium;

  return (
    <div className={cn(
      "flex min-h-screen flex-col",
      isPremium ? "premium-page-bg" : "bg-gradient-hero"
    )}>
      {isPremium && <PremiumSparkles />}
      <Header />
      <main className="flex-1 overflow-hidden pb-16 md:pb-0">{children}</main>
      {showFooter && <Footer />}
      <MobileBottomNav />
    </div>
  );
}
