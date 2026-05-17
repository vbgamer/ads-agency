import { motion, AnimatePresence } from "framer-motion";
import { ArrowDown, Check } from "lucide-react";


interface PullToRefreshIndicatorProps {
  pullDistance: number;
  isRefreshing: boolean;
  canRefresh: boolean;
  isPremium?: boolean;
  threshold?: number;
}

export function PullToRefreshIndicator({
  pullDistance,
  isRefreshing,
  canRefresh,
  isPremium = false,
  threshold = 80,
}: PullToRefreshIndicatorProps) {
  const progress = Math.min(pullDistance / threshold, 1);
  const isVisible = pullDistance > 10 || isRefreshing;
  
  // SVG circle properties
  const size = 56;
  const strokeWidth = 3;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ 
            opacity: 1, 
            y: Math.min(pullDistance * 0.8, 80),
          }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="ptr-indicator"
        >
          <div className={`ptr-container ${isPremium ? 'premium' : ''}`}>
            {/* Progress Ring */}
            <svg 
              width={size} 
              height={size} 
              className="ptr-ring"
              style={{ transform: 'rotate(-90deg)' }}
            >
              {/* Background circle */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke="currentColor"
                strokeWidth={strokeWidth}
                className="text-muted/30"
              />
              {/* Progress circle */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={isRefreshing ? 0 : strokeDashoffset}
                className={`ptr-progress-ring ${isPremium ? 'premium' : ''} ${canRefresh || isRefreshing ? 'ptr-glow' : ''}`}
                style={{
                  transition: isRefreshing ? 'none' : 'stroke-dashoffset 0.1s ease',
                }}
              />
            </svg>

            {/* Center Content */}
            <div className="ptr-center">
              {isRefreshing ? (
                <motion.img
                  src="/icon-192.png"
                  alt="Loading"
                  className={`ptr-logo ${isPremium ? 'premium' : ''}`}
                  animate={{ rotate: 360 }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                />
              ) : canRefresh ? (
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  className={`ptr-icon ${isPremium ? 'premium' : ''}`}
                >
                  <Check className="h-5 w-5" />
                </motion.div>
              ) : (
                <motion.div
                  animate={{ 
                    rotate: progress * 180,
                  }}
                  className="ptr-icon text-muted-foreground"
                >
                  <ArrowDown className="h-5 w-5" />
                </motion.div>
              )}
            </div>
          </div>

          {/* Text hint */}
          <AnimatePresence>
            {(canRefresh || isRefreshing) && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={`ptr-text ${isPremium ? 'premium' : ''}`}
              >
                {isRefreshing ? 'Refreshing...' : 'Release to refresh'}
              </motion.p>
            )}
          </AnimatePresence>

          {/* Loading dots when refreshing */}
          {isRefreshing && (
            <div className="ptr-dots">
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  className={`ptr-dot ${isPremium ? 'premium' : ''}`}
                  animate={{
                    y: [0, -6, 0],
                  }}
                  transition={{
                    duration: 0.6,
                    repeat: Infinity,
                    delay: i * 0.15,
                    ease: "easeInOut",
                  }}
                />
              ))}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
