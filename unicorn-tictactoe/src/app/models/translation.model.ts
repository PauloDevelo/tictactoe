/**
 * Supported languages in the application
 */
export type Language = 'en' | 'fr';

/**
 * Translation key type for type-safe translation lookups
 * Supports nested keys using dot notation (e.g., 'game.status.waiting')
 */
export type TranslationKey = string;

/**
 * Structure for common translations
 */
export interface CommonTranslations {
  buttons: {
    ok: string;
    cancel: string;
    close: string;
    confirm: string;
    back: string;
    next: string;
    save: string;
    delete: string;
    edit: string;
    create: string;
  };
  labels: {
    loading: string;
    error: string;
    success: string;
    warning: string;
    info: string;
    required: string;
    optional: string;
    yes: string;
    no: string;
  };
}

/**
 * Root translation structure
 */
export interface TranslationStructure {
  common: CommonTranslations;
  [key: string]: any; // Allow for additional translation sections
}

/**
 * Language detection result
 */
export interface LanguageDetectionResult {
  detected: string;
  normalized: Language;
  fallback: boolean;
}
