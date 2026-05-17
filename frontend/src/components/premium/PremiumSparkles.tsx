import { motion } from "framer-motion";

interface PremiumSparklesProps {
  count?: number;
}

export function PremiumSparkles({ count = 8 }: PremiumSparklesProps) {
  // Respect reduced motion preference
  const prefersReducedMotion = 
    typeof window !== 'undefined' && 
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (prefersReducedMotion) {
    return null;
  }

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
      {[...Array(count)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute text-yellow-400/30 dark:text-yellow-400/20"
          style={{
            top: `${10 + (i * 12) % 80}%`,
            left: `${5 + (i * 13) % 90}%`,
            fontSize: `${10 + (i % 3) * 4}px`,
          }}
          animate={{
            y: [0, -15, 0],
            opacity: [0.15, 0.4, 0.15],
            scale: [0.8, 1.1, 0.8],
          }}
          transition={{
            duration: 3 + (i * 0.4),
            repeat: Infinity,
            delay: i * 0.5,
            ease: "easeInOut",
          }}
        >
          ✦
        </motion.div>
      ))}
    </div>
  );
}
