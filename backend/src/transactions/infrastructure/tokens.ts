export const TRANSACTION_REPOSITORY = Symbol('ITransactionRepository');
export const CATEGORY_REPOSITORY = Symbol('ICategoryRepository');
export const SUBCATEGORY_REPOSITORY = Symbol('ISubcategoryRepository');

export const CREATE_TRANSACTION_UC = Symbol('CreateTransactionUseCase');
export const UPDATE_TRANSACTION_UC = Symbol('UpdateTransactionUseCase');
export const GET_TRANSACTION_BY_ID_UC = Symbol('GetTransactionByIdUseCase');
export const LIST_TRANSACTIONS_UC = Symbol('ListTransactionsUseCase');
export const DELETE_TRANSACTION_UC = Symbol('DeleteTransactionUseCase');
export const CALCULATE_BALANCE_UC = Symbol('CalculateBalanceUseCase');

export const CREATE_CATEGORY_UC = Symbol('CreateCategoryUseCase');
export const UPDATE_CATEGORY_UC = Symbol('UpdateCategoryUseCase');
export const GET_CATEGORY_BY_ID_UC = Symbol('GetCategoryByIdUseCase');
export const LIST_CATEGORIES_UC = Symbol('ListCategoriesUseCase');
export const DELETE_CATEGORY_UC = Symbol('DeleteCategoryUseCase');

export const CREATE_SUBCATEGORY_UC = Symbol('CreateSubcategoryUseCase');
export const UPDATE_SUBCATEGORY_UC = Symbol('UpdateSubcategoryUseCase');
export const GET_SUBCATEGORY_BY_ID_UC = Symbol('GetSubcategoryByIdUseCase');
export const LIST_SUBCATEGORIES_UC = Symbol('ListSubcategoriesUseCase');
export const DELETE_SUBCATEGORY_UC = Symbol('DeleteSubcategoryUseCase');
