export enum GroceryDepartment {
  PADARIA = 'padaria',
  HORTIFRUTI = 'hortifruti',
  LATICINIOS = 'laticinios',
  CARNES = 'carnes',
  AVES_PEIXES = 'aves-peixes',
  BEBIDAS = 'bebidas',
  MERCEARIA = 'mercearia',
  LIMPEZA = 'limpeza',
  HIGIENE = 'higiene',
  CONGELADOS = 'congelados',
  DOCES_SNACKS = 'doces-snacks',
  PET = 'pet',
  OUTROS = 'outros',
}

export const GROCERY_DEPARTMENTS = Object.values(GroceryDepartment);

export function isGroceryDepartment(value: string): value is GroceryDepartment {
  return (GROCERY_DEPARTMENTS as string[]).includes(value);
}
