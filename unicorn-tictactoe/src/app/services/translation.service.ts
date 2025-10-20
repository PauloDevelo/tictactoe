import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { Language, TranslationKey, TranslationStructure, LanguageDetectionResult } from '../models/translation.model';

/**
 * Translation service that provides internationalization support
 * with automatic browser language detection
 */
@Injectable({
  providedIn: 'root'
})
export class TranslationService {
  private readonly http = inject(HttpClient);
  
  private readonly SUPPORTED_LANGUAGES: Language[] = ['en', 'fr'];
  private readonly DEFAULT_LANGUAGE: Language = 'en';
  private readonly FRENCH_VARIANTS = ['fr', 'fr-FR', 'fr-CA', 'fr-BE', 'fr-CH', 'fr-LU'];
  
  private currentLanguageSubject = new BehaviorSubject<Language>(this.DEFAULT_LANGUAGE);
  private translationsCache = new Map<Language, TranslationStructure>();
  
  /**
   * Observable of the current language
   */
  public currentLanguage$: Observable<Language> = this.currentLanguageSubject.asObservable();
  
  constructor() {
    this.initializeLanguage();
  }
  
  /**
   * Initialize the service by detecting and loading the browser language
   */
  private initializeLanguage(): void {
    const detectedLanguage = this.detectBrowserLanguage();
    this.setLanguage(detectedLanguage.normalized);
  }
  
  /**
   * Detect the browser's language and normalize it to a supported language
   * @returns Language detection result with detected, normalized, and fallback info
   */
  public detectBrowserLanguage(): LanguageDetectionResult {
    // Try navigator.language first, then navigator.languages[0]
    const browserLang = navigator.language || (navigator.languages && navigator.languages[0]) || this.DEFAULT_LANGUAGE;
    
    // Check if it's a French variant
    if (this.FRENCH_VARIANTS.some(variant => browserLang.toLowerCase().startsWith(variant.toLowerCase()))) {
      return {
        detected: browserLang,
        normalized: 'fr',
        fallback: false
      };
    }
    
    // Check if it's English
    if (browserLang.toLowerCase().startsWith('en')) {
      return {
        detected: browserLang,
        normalized: 'en',
        fallback: false
      };
    }
    
    // Fallback to English for unsupported languages
    return {
      detected: browserLang,
      normalized: this.DEFAULT_LANGUAGE,
      fallback: true
    };
  }
  
  /**
   * Set the current language and load its translations
   * @param language The language to set
   */
  public setLanguage(language: Language): void {
    if (!this.SUPPORTED_LANGUAGES.includes(language)) {
      console.warn(`Unsupported language: ${language}. Falling back to ${this.DEFAULT_LANGUAGE}`);
      language = this.DEFAULT_LANGUAGE;
    }
    
    this.loadTranslations(language).subscribe({
      next: () => {
        this.currentLanguageSubject.next(language);
      },
      error: (error) => {
        console.error(`Failed to load translations for ${language}:`, error);
        // Fallback to default language if loading fails
        if (language !== this.DEFAULT_LANGUAGE) {
          this.setLanguage(this.DEFAULT_LANGUAGE);
        }
      }
    });
  }
  
  /**
   * Load translations for a specific language from JSON file
   * @param language The language to load
   * @returns Observable of the loaded translations
   */
  private loadTranslations(language: Language): Observable<TranslationStructure> {
    // Return cached translations if available
    if (this.translationsCache.has(language)) {
      return of(this.translationsCache.get(language)!);
    }
    
    const translationPath = `/assets/i18n/${language}.json`;
    
    return this.http.get<TranslationStructure>(translationPath).pipe(
      tap(translations => {
        this.translationsCache.set(language, translations);
      }),
      catchError(error => {
        console.error(`Error loading translations from ${translationPath}:`, error);
        throw error;
      })
    );
  }
  
  /**
   * Get the current language
   * @returns The current language
   */
  public getCurrentLanguage(): Language {
    return this.currentLanguageSubject.value;
  }
  
  /**
   * Get a translated text by key
   * Supports nested keys using dot notation (e.g., 'game.status.waiting')
   * Falls back to English if translation not found in current language
   * @param key The translation key (supports dot notation for nested keys)
   * @param params Optional parameters for string interpolation
   * @returns The translated text or the key itself if not found
   */
  public translate(key: TranslationKey, params?: Record<string, string | number>): string {
    const currentLang = this.getCurrentLanguage();
    let translation = this.getNestedTranslation(key, currentLang);
    
    // Fallback to English if translation not found and current language is not English
    if (!translation && currentLang !== this.DEFAULT_LANGUAGE) {
      translation = this.getNestedTranslation(key, this.DEFAULT_LANGUAGE);
    }
    
    // If still not found, return the key itself
    if (!translation) {
      console.warn(`Translation not found for key: ${key}`);
      return key;
    }
    
    // Apply parameter interpolation if params provided
    if (params) {
      return this.interpolate(translation, params);
    }
    
    return translation;
  }
  
  /**
   * Get translation from nested object using dot notation
   * @param key The translation key with dot notation
   * @param language The language to get translation from
   * @returns The translation string or null if not found
   */
  private getNestedTranslation(key: TranslationKey, language: Language): string | null {
    const translations = this.translationsCache.get(language);
    
    if (!translations) {
      return null;
    }
    
    const keys = key.split('.');
    let current: any = translations;
    
    for (const k of keys) {
      if (current && typeof current === 'object' && k in current) {
        current = current[k];
      } else {
        return null;
      }
    }
    
    return typeof current === 'string' ? current : null;
  }
  
  /**
   * Interpolate parameters into a translation string
   * Replaces {{paramName}} with the corresponding value from params
   * @param text The text with placeholders
   * @param params The parameters to interpolate
   * @returns The interpolated text
   */
  private interpolate(text: string, params: Record<string, string | number>): string {
    return text.replace(/\{\{(\w+)\}\}/g, (match, paramName) => {
      return params[paramName]?.toString() || match;
    });
  }
  
  /**
   * Get an observable that emits the translated text whenever the language changes
   * @param key The translation key
   * @param params Optional parameters for string interpolation
   * @returns Observable of the translated text
   */
  public translate$(key: TranslationKey, params?: Record<string, string | number>): Observable<string> {
    return this.currentLanguage$.pipe(
      map(() => this.translate(key, params))
    );
  }
}
