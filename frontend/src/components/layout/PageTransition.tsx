import { motion, useReducedMotion, type Transition } from "framer-motion";
import { ReactNode } from "react";

export type TransitionVariant = "fade" | "slideUp" | "slideRight" | "slideLeft" | "scale";

interface PageTransitionProps {
  children: ReactNode;
  variant?: TransitionVariant;
  className?: string;
}

export const transitionVariants = {
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  slideUp: {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  },
  slideRight: {
    initial: { opacity: 0, x: 50 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -50 },
  },
  slideLeft: {
    initial: { opacity: 0, x: -50 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 50 },
  },
  scale: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 1.02 },
  },
};

const pageTransition: Transition = {
  type: "tween",
  ease: [0.4, 0, 0.2, 1],
  duration: 0.3,
};

const reducedMotionTransition: Transition = {
  type: "tween",
  ease: [0.4, 0, 0.2, 1],
  duration: 0.15,
};

export function PageTransition({ 
  children, 
  variant = "slideUp",
  className = ""
}: PageTransitionProps) {
  const shouldReduceMotion = useReducedMotion();
  
  const selectedVariant = shouldReduceMotion 
    ? transitionVariants.fade 
    : transitionVariants[variant];

  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={selectedVariant}
      transition={shouldReduceMotion ? reducedMotionTransition : pageTransition}
      className={`page-transition-wrapper ${className}`}
    >
      {children}
    </motion.div>
  );
}
