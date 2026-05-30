import { evaluatePasswordStrength } from '@/lib/passwordStrength';
import { Check, X } from 'lucide-react';

interface PasswordStrengthMeterProps {
  password: string;
}

const BAR_COLOR: Record<string, string> = {
  red:    'bg-red-500',
  orange: 'bg-orange-500',
  amber:  'bg-amber-500',
  lime:   'bg-lime-500',
  green:  'bg-green-500',
};

const TEXT_COLOR: Record<string, string> = {
  red:    'text-red-500',
  orange: 'text-orange-500',
  amber:  'text-amber-500',
  lime:   'text-lime-600',
  green:  'text-green-600',
};

export function PasswordStrengthMeter({ password }: PasswordStrengthMeterProps) {
  if (!password) return null;

  const result = evaluatePasswordStrength(password);
  const filledBars = result.score + 1; // 1..5
  const requirements = [
    { label: 'At least 12 characters', met: !result.failedChecks.includes('At least 12 characters') },
    { label: 'A lowercase letter',     met: !result.failedChecks.includes('A lowercase letter') },
    { label: 'An uppercase letter',    met: !result.failedChecks.includes('An uppercase letter') },
    { label: 'A number',               met: !result.failedChecks.includes('A number') },
    { label: 'A symbol (!@#$ etc.)',   met: !result.failedChecks.includes('A symbol (!@#$ etc.)') },
  ];

  return (
    <div className="space-y-2 mt-2" data-testid="password-strength-meter">
      {/* Strength bars */}
      <div className="flex gap-1">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded transition-colors ${
              i < filledBars ? BAR_COLOR[result.color] : 'bg-muted'
            }`}
          />
        ))}
      </div>

      {/* Label */}
      <p className={`text-xs font-medium ${TEXT_COLOR[result.color]}`}>
        {result.label}
        {!result.isAcceptable && password.length > 0 && (
          <span className="text-muted-foreground"> · use a stronger password</span>
        )}
      </p>

      {/* Requirements checklist (only show when password is being typed) */}
      {!result.isAcceptable && (
        <ul className="text-xs space-y-1">
          {requirements.map((r) => (
            <li
              key={r.label}
              className={`flex items-center gap-1.5 ${
                r.met ? 'text-green-600' : 'text-muted-foreground'
              }`}
            >
              {r.met ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
              {r.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
