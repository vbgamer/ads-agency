/**
 * Password strength evaluator + validator.
 * Used by signup forms to enforce a minimum security baseline before the
 * password ever reaches Supabase Auth.
 */

export interface PasswordStrength {
  score: 0 | 1 | 2 | 3 | 4;       // 0 = very weak ... 4 = strong
  label: 'Very weak' | 'Weak' | 'Fair' | 'Good' | 'Strong';
  color: 'red' | 'orange' | 'amber' | 'lime' | 'green';
  failedChecks: string[];          // human-readable list of unmet rules
  isAcceptable: boolean;           // score >= 3 AND no critical failures
}

const COMMON_PASSWORDS = new Set([
  'password', 'password123', '12345678', '123456789', '1234567890',
  'qwerty', 'qwerty123', 'admin', 'admin123', 'letmein', 'welcome',
  'monkey', 'iloveyou', 'abc12345', '11111111', 'sunshine',
  'password1', 'admssimsim', 'adssimsim', 'changeme',
]);

export function evaluatePasswordStrength(pw: string): PasswordStrength {
  const failed: string[] = [];

  if (!pw || pw.length < 12) failed.push('At least 12 characters');
  if (!/[a-z]/.test(pw))     failed.push('A lowercase letter');
  if (!/[A-Z]/.test(pw))     failed.push('An uppercase letter');
  if (!/\d/.test(pw))        failed.push('A number');
  if (!/[^A-Za-z0-9]/.test(pw)) failed.push('A symbol (!@#$ etc.)');
  if (COMMON_PASSWORDS.has(pw.toLowerCase())) {
    failed.push('Must not be a common password');
  }

  // Repeating chars like "aaaaaa" — weak
  if (/(.)\1{4,}/.test(pw)) {
    failed.push('No long runs of repeated characters');
  }

  // Score = 4 - clamp(failed.length, 0..4)
  const passedCount = Math.max(0, 5 - failed.length);
  const score = Math.min(4, passedCount) as 0 | 1 | 2 | 3 | 4;

  const meta = ([
    { label: 'Very weak' as const, color: 'red' as const },
    { label: 'Weak' as const,      color: 'orange' as const },
    { label: 'Fair' as const,      color: 'amber' as const },
    { label: 'Good' as const,      color: 'lime' as const },
    { label: 'Strong' as const,    color: 'green' as const },
  ])[score];

  return {
    score,
    label: meta.label,
    color: meta.color,
    failedChecks: failed,
    // Strict: every rule must pass.
    isAcceptable: failed.length === 0,
  };
}
