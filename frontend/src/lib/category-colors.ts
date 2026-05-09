export interface CategoryColor {
  key: string;
  hex: string;
  label: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
}

export const CATEGORY_COLORS: readonly CategoryColor[] = [
  {
    key: 'blue',
    hex: '#4a8ee8',
    label: 'Azul',
    bgClass: 'bg-brand-blue',
    textClass: 'text-brand-blue',
    borderClass: 'border-brand-blue',
  },
  {
    key: 'red',
    hex: '#e8614a',
    label: 'Vermelho',
    bgClass: 'bg-brand-red',
    textClass: 'text-brand-red',
    borderClass: 'border-brand-red',
  },
  {
    key: 'gold',
    hex: '#d4a840',
    label: 'Dourado',
    bgClass: 'bg-brand-gold',
    textClass: 'text-brand-gold',
    borderClass: 'border-brand-gold',
  },
  {
    key: 'green',
    hex: '#1fba7a',
    label: 'Verde',
    bgClass: 'bg-brand-green',
    textClass: 'text-brand-green',
    borderClass: 'border-brand-green',
  },
  {
    key: 'purple',
    hex: '#a06ae0',
    label: 'Roxo',
    bgClass: 'bg-brand-purple',
    textClass: 'text-brand-purple',
    borderClass: 'border-brand-purple',
  },
  {
    key: 'pink',
    hex: '#e8609a',
    label: 'Rosa',
    bgClass: 'bg-brand-pink',
    textClass: 'text-brand-pink',
    borderClass: 'border-brand-pink',
  },
  {
    key: 'cyan',
    hex: '#5bc8e8',
    label: 'Ciano',
    bgClass: 'bg-brand-cyan',
    textClass: 'text-brand-cyan',
    borderClass: 'border-brand-cyan',
  },
  {
    key: 'orange',
    hex: '#e8a44a',
    label: 'Laranja',
    bgClass: 'bg-brand-orange',
    textClass: 'text-brand-orange',
    borderClass: 'border-brand-orange',
  },
  {
    key: 'lime',
    hex: '#78e85b',
    label: 'Lima',
    bgClass: 'bg-brand-lime',
    textClass: 'text-brand-lime',
    borderClass: 'border-brand-lime',
  },
] as const;

const FALLBACK: CategoryColor = {
  key: 'muted',
  hex: '#999999',
  label: 'Cinza',
  bgClass: 'bg-muted',
  textClass: 'text-muted-foreground',
  borderClass: 'border-border',
};

export function colorFromHex(hex: string | undefined | null): CategoryColor {
  if (!hex) return FALLBACK;
  const normalized = hex.toLowerCase();
  return CATEGORY_COLORS.find((c) => c.hex.toLowerCase() === normalized) ?? FALLBACK;
}

export const DEFAULT_CATEGORY_HEX = CATEGORY_COLORS[0]?.hex ?? '#4a8ee8';
