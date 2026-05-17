import { motion } from "framer-motion";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { PullToRefreshIndicator } from "./PullToRefreshIndicator";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/hooks/useAuth";

interface PullToRefreshProps {
  children: React.ReactNode;
  onRefresh: () => Promise<void>;
  disabled?: boolean;
}

export function PullToRefresh({
  children,
  onRefresh,
  disabled = false,
}: PullToRefreshProps) {
  const isMobile = useIsMobile();
  const { profile } = useAuth();
  const isPremium = profile?.is_premium ?? false;
  
  const {
    pullDistance,
    isRefreshing,
    canRefresh,
    containerRef,
  } = usePullToRefresh({
    onRefresh,
    disabled: disabled || !isMobile,
  });

  // On desktop, just render children without any pull-to-refresh
  if (!isMobile) {
    return <>{children}</>;
  }

  return (
    <div ref={containerRef} className="relative min-h-screen">
      <PullToRefreshIndicator
        pullDistance={pullDistance}
        isRefreshing={isRefreshing}
        canRefresh={canRefresh}
        isPremium={isPremium}
      />
      <motion.div
        animate={{
          y: isRefreshing ? 60 : pullDistance * 0.5,
        }}
        transition={{
          type: "spring",
          stiffness: 400,
          damping: 40,
        }}
      >
        {children}
      </motion.div>
    </div>
  );
}
