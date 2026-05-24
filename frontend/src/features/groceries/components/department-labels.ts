import type { GroceryDepartment } from '@/types/api';

const DEPARTMENT_LABELS: Record<GroceryDepartment, string> = {
  padaria: 'Padaria',
  hortifruti: 'Hortifruti',
  laticinios: 'Laticínios',
  carnes: 'Carnes',
  'aves-peixes': 'Aves e peixes',
  bebidas: 'Bebidas',
  mercearia: 'Mercearia',
  limpeza: 'Limpeza',
  higiene: 'Higiene',
  congelados: 'Congelados',
  'doces-snacks': 'Doces e snacks',
  pet: 'Pet',
  outros: 'Outros',
};

export function departmentLabel(slug: string): string {
  return DEPARTMENT_LABELS[slug as GroceryDepartment] ?? slug;
}

export const GROCERY_DEPARTMENTS = Object.keys(DEPARTMENT_LABELS) as GroceryDepartment[];
