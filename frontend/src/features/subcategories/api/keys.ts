export const subcategoryKeys = {
  all: ['subcategories'] as const,
  lists: () => [...subcategoryKeys.all, 'list'] as const,
  byUser: () => [...subcategoryKeys.lists(), 'by-user'] as const,
  byCategory: (categoryId: string) =>
    [...subcategoryKeys.lists(), 'by-category', categoryId] as const,
  details: () => [...subcategoryKeys.all, 'detail'] as const,
  detail: (id: string) => [...subcategoryKeys.details(), id] as const,
};
