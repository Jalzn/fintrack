import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { passwordRules } from '../schemas/auth-schemas';

interface PasswordStrengthProps {
  password: string;
}

const RULES: Array<{ key: keyof typeof passwordRules; label: string }> = [
  { key: 'length', label: '8+ caracteres' },
  { key: 'uppercase', label: 'Letra maiúscula' },
  { key: 'number', label: 'Número' },
  { key: 'symbol', label: 'Símbolo' },
];

const SCORE_COLOR = ['bg-muted', 'bg-expense', 'bg-brand-orange', 'bg-brand-gold', 'bg-income'];

export function PasswordStrength({ password }: PasswordStrengthProps) {
  const checks = RULES.map((rule) => ({
    ...rule,
    passed: passwordRules[rule.key](password),
  }));
  const score = checks.filter((c) => c.passed).length;
  const fillColor = SCORE_COLOR[score] ?? 'bg-muted';

  if (password.length === 0) {
    return (
      <p className="text-muted-foreground text-xs">
        Mínimo 8 caracteres, com maiúscula, número e símbolo.
      </p>
    );
  }

  return (
    <div className="space-y-2" aria-live="polite">
      <div
        className="flex gap-1"
        role="progressbar"
        aria-label="Força da senha"
        aria-valuemin={0}
        aria-valuemax={4}
        aria-valuenow={score}
      >
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={cn(
              'h-1 flex-1 rounded-full transition-colors',
              i < score ? fillColor : 'bg-muted',
            )}
          />
        ))}
      </div>
      <ul className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-xs">
        {checks.map((check) => (
          <li
            key={check.key}
            className={cn(
              'flex items-center gap-1.5',
              check.passed ? 'text-income' : 'text-muted-foreground',
            )}
          >
            {check.passed ? (
              <Check aria-hidden="true" className="size-3" />
            ) : (
              <X aria-hidden="true" className="size-3" />
            )}
            {check.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
