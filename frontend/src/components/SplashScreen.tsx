import { motion, AnimatePresence } from "framer-motion";
import { Crown } from "lucide-react";


interface SplashScreenProps {
  isVisible: boolean;
  isPremium?: boolean;
}

export function SplashScreen({ isVisible, isPremium = false }: SplashScreenProps) {
  const brandName = "ADSSIMSIM";
  
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className={`fixed inset-0 z-50 flex flex-col items-center justify-center ${
            isPremium ? 'splash-gradient-premium' : 'splash-gradient'
          }`}
        >
          {/* Animated background elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <motion.div
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.1, 0.2, 0.1]
              }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className={`absolute top-1/4 left-1/4 w-64 h-64 rounded-full blur-3xl ${
                isPremium ? 'bg-yellow-400/20' : 'bg-red-500/20'
              }`}
            />
            <motion.div
              animate={{ 
                scale: [1.2, 1, 1.2],
                opacity: [0.15, 0.25, 0.15]
              }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className={`absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full blur-3xl ${
                isPremium ? 'bg-amber-500/15' : 'bg-fuchsia-500/15'
              }`}
            />
            
            {/* Third accent orb for non-premium - adds depth */}
            {!isPremium && (
              <motion.div
                animate={{ 
                  scale: [1, 1.15, 1],
                  opacity: [0.08, 0.15, 0.08]
                }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                className="absolute top-1/2 right-1/3 w-72 h-72 rounded-full blur-3xl bg-purple-500/10"
              />
            )}
            
            {/* Premium floating sparkles */}
            {isPremium && (
              <>
                {[...Array(6)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute text-yellow-400 text-lg"
                    style={{
                      top: `${20 + (i * 10) % 60}%`,
                      left: `${10 + (i * 15) % 80}%`,
                    }}
                    animate={{
                      y: [0, -20, 0],
                      opacity: [0.3, 1, 0.3],
                      scale: [0.8, 1.2, 0.8],
                    }}
                    transition={{
                      duration: 2 + (i * 0.3),
                      repeat: Infinity,
                      delay: i * 0.3,
                    }}
                  >
                    ✦
                  </motion.div>
                ))}
              </>
            )}
          </div>

          {/* Premium Crown */}
          {isPremium && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.5 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5, ease: "easeOut" }}
              className="mb-2"
            >
              <Crown className="h-8 w-8 text-yellow-500 drop-shadow-lg" />
            </motion.div>
          )}

          {/* Logo with pulse-glow animation */}
          <motion.div
            initial={{ scale: 0.5, opacity: 0, rotate: -10 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={{ 
              duration: 0.6, 
              ease: [0.34, 1.56, 0.64, 1],
              delay: 0.1
            }}
            className="relative"
          >
            <motion.div
              animate={{ 
                boxShadow: isPremium
                  ? [
                      "0 0 30px hsl(45, 93%, 50%, 0.4), 0 0 60px hsl(160, 84%, 39%, 0.2)",
                      "0 0 50px hsl(45, 93%, 50%, 0.6), 0 0 100px hsl(160, 84%, 39%, 0.3)",
                      "0 0 30px hsl(45, 93%, 50%, 0.4), 0 0 60px hsl(160, 84%, 39%, 0.2)"
                    ]
                  : [
                      "0 0 30px hsl(0, 100%, 53%, 0.3), 0 0 60px hsl(313, 100%, 50%, 0.15)",
                      "0 0 50px hsl(0, 100%, 53%, 0.5), 0 0 100px hsl(313, 100%, 50%, 0.25)",
                      "0 0 30px hsl(0, 100%, 53%, 0.3), 0 0 60px hsl(313, 100%, 50%, 0.15)"
                    ]
              }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="rounded-2xl"
            >
              <img
                src="/Adssimsim_Logo.png"
                alt="ADSSIMSIM"
                className={`h-28 w-28 rounded-2xl object-contain ${
                  isPremium ? 'splash-logo-glow-premium' : 'splash-logo-glow'
                }`}
              />
            </motion.div>
          </motion.div>
          
          {/* Brand name with staggered letter animation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="mt-8 flex overflow-hidden"
          >
            {brandName.split("").map((letter, index) => (
              <motion.span
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ 
                  delay: 0.5 + index * 0.05,
                  duration: 0.3,
                  ease: "easeOut"
                }}
                className={`font-display text-4xl font-bold ${
                  isPremium ? 'text-gradient-gold' : 'text-gradient-primary'
                }`}
              >
                {letter}
              </motion.span>
            ))}
          </motion.div>

          {/* Premium Badge */}
          {isPremium && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1, duration: 0.4 }}
              className="mt-2 px-3 py-1 rounded-full bg-gradient-premium-gold text-white text-xs font-semibold tracking-wider badge-premium-shimmer"
            >
              PREMIUM
            </motion.div>
          )}
          
          {/* Tagline */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.4 }}
            className="mt-3 text-muted-foreground text-lg"
          >
            {isPremium ? 'Welcome back, Premium Member' : 'Earn cashback on every purchase'}
          </motion.p>
          
          {/* Loading dots */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="mt-10 flex gap-2"
          >
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                animate={{ 
                  scale: [1, 1.3, 1],
                  opacity: [0.4, 1, 0.4]
                }}
                transition={{ 
                  repeat: Infinity, 
                  duration: 1.2, 
                  delay: i * 0.15,
                  ease: "easeInOut"
                }}
                className={`h-2.5 w-2.5 rounded-full ${
                  isPremium ? 'bg-gradient-premium-gold' : 'bg-gradient-primary'
                }`}
              />
            ))}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
