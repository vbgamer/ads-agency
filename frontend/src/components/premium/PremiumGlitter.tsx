import { useMemo } from "react";

// Golden palette: vary slightly between bright gold and amber
const GOLD_COLORS = [
  "hsl(45, 95%, 60%)",
  "hsl(43, 90%, 55%)",
  "hsl(48, 100%, 65%)",
  "hsl(40, 88%, 50%)",
  "hsl(50, 95%, 70%)",
  "hsl(38, 85%, 48%)",
];

// Shapes: circles and diamond glints
const SHAPES = ["50%", "50%", "50%", "0%", "50%", "50%"];

interface Particle {
  id: number;
  left: string;
  bottom: string;
  size: number;
  color: string;
  borderRadius: string;
  duration: number;
  delay: number;
  rotation: number;
}

function seededRandom(seed: number) {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}

export function PremiumGlitter() {
  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const particles: Particle[] = useMemo(() => {
    return Array.from({ length: 18 }, (_, i) => ({
      id: i,
      left: `${5 + seededRandom(i * 7) * 90}%`,
      bottom: `${-5 + seededRandom(i * 11) * 10}%`,
      size: 4 + seededRandom(i * 3) * 8,
      color: GOLD_COLORS[i % GOLD_COLORS.length],
      borderRadius: SHAPES[i % SHAPES.length],
      duration: 6 + seededRandom(i * 5) * 10,
      delay: seededRandom(i * 13) * 8,
      rotation: seededRandom(i * 17) * 360,
    }));
  }, []);

  if (prefersReducedMotion) return null;

  return (
    <div aria-hidden="true" style={{ pointerEvents: "none" }}>
      {particles.map((p) => (
        <div
          key={p.id}
          className="premium-glitter-particle"
          style={{
            left: p.left,
            bottom: p.bottom,
            width: p.size,
            height: p.size,
            background: p.color,
            borderRadius: p.borderRadius,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
            boxShadow: `0 0 ${p.size}px ${p.color}`,
          }}
        />
      ))}
    </div>
  );
}
