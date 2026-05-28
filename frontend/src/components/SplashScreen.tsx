import { motion, AnimatePresence } from "framer-motion";
import { Crown, Sparkles, Star } from "lucide-react";


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
            {isPremium ? (
              <>
                {/* Premium: Luxurious golden orbs */}
                <motion.div
                  animate={{ 
                    scale: [1, 1.3, 1],
                    opacity: [0.2, 0.4, 0.2],
                    rotate: [0, 180, 360]
                  }}
                  transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute top-1/4 left-1/4 w-80 h-80 rounded-full blur-3xl bg-gradient-to-r from-yellow-400/30 via-amber-500/20 to-orange-400/30"
                />
                <motion.div
                  animate={{ 
                    scale: [1.2, 1, 1.2],
                    opacity: [0.25, 0.4, 0.25],
                    rotate: [360, 180, 0]
                  }}
                  transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                  className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full blur-3xl bg-gradient-to-r from-emerald-400/20 via-teal-500/15 to-cyan-400/20"
                />
                {/* Premium shimmer line */}
                <motion.div
                  animate={{ 
                    x: ["-100%", "200%"],
                    opacity: [0, 1, 0]
                  }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", repeatDelay: 1 }}
                  className="absolute top-1/2 left-0 w-1/2 h-px bg-gradient-to-r from-transparent via-yellow-400/60 to-transparent"
                />
              </>
            ) : (
              <>
                {/* Normal: Standard colorful orbs */}
                <motion.div
                  animate={{ 
                    scale: [1, 1.2, 1],
                    opacity: [0.1, 0.2, 0.1]
                  }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full blur-3xl bg-red-500/20"
                />
                <motion.div
                  animate={{ 
                    scale: [1.2, 1, 1.2],
                    opacity: [0.15, 0.25, 0.15]
                  }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                  className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full blur-3xl bg-fuchsia-500/15"
                />
                <motion.div
                  animate={{ 
                    scale: [1, 1.15, 1],
                    opacity: [0.08, 0.15, 0.08]
                  }}
                  transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                  className="absolute top-1/2 right-1/3 w-72 h-72 rounded-full blur-3xl bg-purple-500/10"
                />
              </>
            )}
            
            {/* Premium floating sparkles - more elaborate */}
            {isPremium && (
              <>
                {[...Array(12)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute text-yellow-400"
                    style={{
                      top: `${10 + (i * 7) % 80}%`,
                      left: `${5 + (i * 8) % 90}%`,
                      fontSize: `${12 + (i % 3) * 6}px`,
                    }}
                    animate={{
                      y: [0, -30, 0],
                      x: [0, (i % 2 === 0 ? 10 : -10), 0],
                      opacity: [0.2, 1, 0.2],
                      scale: [0.6, 1.3, 0.6],
                      rotate: [0, 180, 360],
                    }}
                    transition={{
                      duration: 2.5 + (i * 0.2),
                      repeat: Infinity,
                      delay: i * 0.15,
                      ease: "easeInOut",
                    }}
                  >
                    ✦
                  </motion.div>
                ))}
                {/* Additional star particles for premium */}
                {[...Array(4)].map((_, i) => (
                  <motion.div
                    key={`star-${i}`}
                    className="absolute text-amber-300/60"
                    style={{
                      top: `${20 + (i * 20) % 60}%`,
                      left: `${15 + (i * 25) % 70}%`,
                    }}
                    animate={{
                      scale: [0.5, 1.5, 0.5],
                      opacity: [0.3, 0.8, 0.3],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      delay: i * 0.5,
                    }}
                  >
                    <Star className="h-4 w-4 fill-current" />
                  </motion.div>
                ))}
              </>
            )}
          </div>

          {/* Premium Crown with enhanced animation */}
          {isPremium && (
            <motion.div
              initial={{ opacity: 0, y: -40, scale: 0.3, rotate: -20 }}
              animate={{ opacity: 1, y: 0, scale: 1, rotate: 0 }}
              transition={{ delay: 0.1, duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
              className="mb-3"
            >
              <motion.div
                animate={{ 
                  y: [0, -5, 0],
                  filter: [
                    "drop-shadow(0 0 10px rgba(234, 179, 8, 0.5))",
                    "drop-shadow(0 0 20px rgba(234, 179, 8, 0.8))",
                    "drop-shadow(0 0 10px rgba(234, 179, 8, 0.5))"
                  ]
                }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                <Crown className="h-10 w-10 text-yellow-500" />
              </motion.div>
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
            className={`mt-3 text-lg ${isPremium ? 'text-amber-100' : 'text-muted-foreground'}`}
          >
            {isPremium ? 'Welcome back, Premium Member' : 'Earn cashback on every purchase'}
          </motion.p>
          
          {/* Loading indicator - Premium vs Normal */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="mt-10"
          >
            {isPremium ? (
              // Premium: Elegant golden ring loader
              <div className="relative">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="w-12 h-12 rounded-full border-2 border-yellow-500/20"
                  style={{
                    borderTopColor: 'rgb(234, 179, 8)',
                    borderRightColor: 'rgb(245, 158, 11)',
                  }}
                />
                <motion.div
                  animate={{ 
                    scale: [1, 1.2, 1],
                    opacity: [0.5, 1, 0.5]
                  }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <Sparkles className="h-5 w-5 text-yellow-500" />
                </motion.div>
              </div>
            ) : (
              // Normal: Simple bouncing dots
              <div className="flex gap-2">
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
                    className="h-2.5 w-2.5 rounded-full bg-gradient-primary"
                  />
                ))}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
