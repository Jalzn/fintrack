export const GROCERY_RECEIPT_REPOSITORY = Symbol('IGroceryReceiptRepository');
export const GROCERY_SETTINGS_REPOSITORY = Symbol('IGrocerySettingsRepository');
export const RECEIPT_EXTRACTOR = Symbol('IReceiptExtractor');

export const IMPORT_RECEIPT_UC = Symbol('ImportReceiptFromImageUseCase');
export const LIST_RECEIPTS_UC = Symbol('ListReceiptsUseCase');
export const GET_RECEIPT_BY_ID_UC = Symbol('GetReceiptByIdUseCase');
export const DELETE_RECEIPT_UC = Symbol('DeleteReceiptUseCase');
export const ANALYZE_PRICES_UC = Symbol('AnalyzePricesUseCase');
export const GET_GROCERY_SUMMARY_UC = Symbol('GetGrocerySummaryUseCase');
export const GET_GROCERY_SETTINGS_UC = Symbol('GetGrocerySettingsUseCase');
export const UPDATE_GROCERY_SETTINGS_UC = Symbol('UpdateGrocerySettingsUseCase');
