import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TranslationService } from './translation.service';
import { Language, TranslationStructure } from '../models/translation.model';

describe('TranslationService', () => {
  let service: TranslationService;
  let httpMock: HttpTestingController;
  
  const mockEnglishTranslations: TranslationStructure = {
    common: {
      buttons: {
        ok: 'OK',
        cancel: 'Cancel',
        close: 'Close',
        confirm: 'Confirm',
        back: 'Back',
        next: 'Next',
        save: 'Save',
        delete: 'Delete',
        edit: 'Edit',
        create: 'Create'
      },
      labels: {
        loading: 'Loading...',
        error: 'Error',
        success: 'Success',
        warning: 'Warning',
        info: 'Information',
        required: 'Required',
        optional: 'Optional',
        yes: 'Yes',
        no: 'No'
      }
    },
    game: {
      status: {
        waiting: 'Waiting for players',
        playing: 'Game in progress',
        finished: 'Game finished'
      }
    }
  };
  
  const mockFrenchTranslations: TranslationStructure = {
    common: {
      buttons: {
        ok: 'OK',
        cancel: 'Annuler',
        close: 'Fermer',
        confirm: 'Confirmer',
        back: 'Retour',
        next: 'Suivant',
        save: 'Enregistrer',
        delete: 'Supprimer',
        edit: 'Modifier',
        create: 'Créer'
      },
      labels: {
        loading: 'Chargement...',
        error: 'Erreur',
        success: 'Succès',
        warning: 'Avertissement',
        info: 'Information',
        required: 'Requis',
        optional: 'Optionnel',
        yes: 'Oui',
        no: 'Non'
      }
    },
    game: {
      status: {
        waiting: 'En attente de joueurs',
        playing: 'Partie en cours',
        finished: 'Partie terminée'
      }
    }
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [TranslationService]
    });
    
    service = TestBed.inject(TranslationService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('Browser Language Detection', () => {
    it('should detect French browser language (fr)', () => {
      // Mock navigator.language
      Object.defineProperty(navigator, 'language', {
        value: 'fr',
        configurable: true
      });
      
      const result = service.detectBrowserLanguage();
      
      expect(result.detected).toBe('fr');
      expect(result.normalized).toBe('fr');
      expect(result.fallback).toBe(false);
    });

    it('should detect French browser language (fr-FR)', () => {
      Object.defineProperty(navigator, 'language', {
        value: 'fr-FR',
        configurable: true
      });
      
      const result = service.detectBrowserLanguage();
      
      expect(result.detected).toBe('fr-FR');
      expect(result.normalized).toBe('fr');
      expect(result.fallback).toBe(false);
    });

    it('should detect French browser language (fr-CA)', () => {
      Object.defineProperty(navigator, 'language', {
        value: 'fr-CA',
        configurable: true
      });
      
      const result = service.detectBrowserLanguage();
      
      expect(result.detected).toBe('fr-CA');
      expect(result.normalized).toBe('fr');
      expect(result.fallback).toBe(false);
    });

    it('should detect French browser language (fr-BE)', () => {
      Object.defineProperty(navigator, 'language', {
        value: 'fr-BE',
        configurable: true
      });
      
      const result = service.detectBrowserLanguage();
      
      expect(result.detected).toBe('fr-BE');
      expect(result.normalized).toBe('fr');
      expect(result.fallback).toBe(false);
    });

    it('should detect English browser language (en)', () => {
      Object.defineProperty(navigator, 'language', {
        value: 'en',
        configurable: true
      });
      
      const result = service.detectBrowserLanguage();
      
      expect(result.detected).toBe('en');
      expect(result.normalized).toBe('en');
      expect(result.fallback).toBe(false);
    });

    it('should detect English browser language (en-US)', () => {
      Object.defineProperty(navigator, 'language', {
        value: 'en-US',
        configurable: true
      });
      
      const result = service.detectBrowserLanguage();
      
      expect(result.detected).toBe('en-US');
      expect(result.normalized).toBe('en');
      expect(result.fallback).toBe(false);
    });

    it('should fallback to English for Spanish (es)', () => {
      Object.defineProperty(navigator, 'language', {
        value: 'es',
        configurable: true
      });
      
      const result = service.detectBrowserLanguage();
      
      expect(result.detected).toBe('es');
      expect(result.normalized).toBe('en');
      expect(result.fallback).toBe(true);
    });

    it('should fallback to English for German (de)', () => {
      Object.defineProperty(navigator, 'language', {
        value: 'de',
        configurable: true
      });
      
      const result = service.detectBrowserLanguage();
      
      expect(result.detected).toBe('de');
      expect(result.normalized).toBe('en');
      expect(result.fallback).toBe(true);
    });

    it('should fallback to English for Italian (it)', () => {
      Object.defineProperty(navigator, 'language', {
        value: 'it',
        configurable: true
      });
      
      const result = service.detectBrowserLanguage();
      
      expect(result.detected).toBe('it');
      expect(result.normalized).toBe('en');
      expect(result.fallback).toBe(true);
    });

    it('should fallback to English for Japanese (ja)', () => {
      Object.defineProperty(navigator, 'language', {
        value: 'ja',
        configurable: true
      });
      
      const result = service.detectBrowserLanguage();
      
      expect(result.detected).toBe('ja');
      expect(result.normalized).toBe('en');
      expect(result.fallback).toBe(true);
    });
  });

  describe('Language Loading and Setting', () => {
    it('should load English translations on initialization', () => {
      const req = httpMock.expectOne('/assets/i18n/en.json');
      expect(req.request.method).toBe('GET');
      req.flush(mockEnglishTranslations);
      
      expect(service.getCurrentLanguage()).toBe('en');
    });

    it('should set language to French and load French translations', (done) => {
      // First, handle the initial English load
      const initialReq = httpMock.expectOne('/assets/i18n/en.json');
      initialReq.flush(mockEnglishTranslations);
      
      // Now set to French
      service.setLanguage('fr');
      
      const req = httpMock.expectOne('/assets/i18n/fr.json');
      expect(req.request.method).toBe('GET');
      req.flush(mockFrenchTranslations);
      
      // Wait for language to be set
      setTimeout(() => {
        expect(service.getCurrentLanguage()).toBe('fr');
        done();
      }, 100);
    });

    it('should cache loaded translations', () => {
      // Load English
      const req1 = httpMock.expectOne('/assets/i18n/en.json');
      req1.flush(mockEnglishTranslations);
      
      // Set to French
      service.setLanguage('fr');
      const req2 = httpMock.expectOne('/assets/i18n/fr.json');
      req2.flush(mockFrenchTranslations);
      
      // Set back to English - should not make another HTTP request
      service.setLanguage('en');
      httpMock.expectNone('/assets/i18n/en.json');
    });

    it('should fallback to English if unsupported language is set', () => {
      const req = httpMock.expectOne('/assets/i18n/en.json');
      req.flush(mockEnglishTranslations);
      
      const consoleSpy = spyOn(console, 'warn');
      service.setLanguage('es' as Language);
      
      expect(consoleSpy).toHaveBeenCalledWith(
        jasmine.stringContaining('Unsupported language: es')
      );
      expect(service.getCurrentLanguage()).toBe('en');
    });
  });

  describe('Translation Lookup', () => {
    beforeEach(() => {
      // Load English translations
      const req = httpMock.expectOne('/assets/i18n/en.json');
      req.flush(mockEnglishTranslations);
    });

    it('should translate simple key', () => {
      const translation = service.translate('common.buttons.ok');
      expect(translation).toBe('OK');
    });

    it('should translate nested key', () => {
      const translation = service.translate('game.status.waiting');
      expect(translation).toBe('Waiting for players');
    });

    it('should translate deeply nested key', () => {
      const translation = service.translate('common.labels.loading');
      expect(translation).toBe('Loading...');
    });

    it('should return key if translation not found', () => {
      const consoleSpy = spyOn(console, 'warn');
      const translation = service.translate('nonexistent.key');
      
      expect(translation).toBe('nonexistent.key');
      expect(consoleSpy).toHaveBeenCalledWith(
        'Translation not found for key: nonexistent.key'
      );
    });

    it('should fallback to English if translation not found in current language', (done) => {
      // Set to French
      service.setLanguage('fr');
      const req = httpMock.expectOne('/assets/i18n/fr.json');
      
      // French translations without a specific key
      const incompleteFrenchTranslations = {
        common: {
          buttons: {
            ok: 'OK'
          },
          labels: {
            loading: 'Chargement...'
          }
        }
      };
      req.flush(incompleteFrenchTranslations);
      
      setTimeout(() => {
        // This key exists in English but not in French
        const translation = service.translate('common.buttons.cancel');
        expect(translation).toBe('Cancel'); // Should fallback to English
        done();
      }, 100);
    });

    it('should interpolate parameters in translation', () => {
      // Add a translation with parameters to the mock
      (mockEnglishTranslations as any).test = {
        greeting: 'Hello, {{name}}!'
      };
      
      const translation = service.translate('test.greeting', { name: 'John' });
      expect(translation).toBe('Hello, John!');
    });

    it('should interpolate multiple parameters', () => {
      (mockEnglishTranslations as any).test = {
        message: 'Player {{player}} scored {{points}} points'
      };
      
      const translation = service.translate('test.message', { 
        player: 'Alice', 
        points: 100 
      });
      expect(translation).toBe('Player Alice scored 100 points');
    });

    it('should keep placeholder if parameter not provided', () => {
      (mockEnglishTranslations as any).test = {
        greeting: 'Hello, {{name}}!'
      };
      
      const translation = service.translate('test.greeting', {});
      expect(translation).toBe('Hello, {{name}}!');
    });
  });

  describe('Observable Translation', () => {
    beforeEach(() => {
      const req = httpMock.expectOne('/assets/i18n/en.json');
      req.flush(mockEnglishTranslations);
    });

    it('should emit translated text when language changes', (done) => {
      const translations: string[] = [];
      
      service.translate$('common.buttons.cancel').subscribe(text => {
        translations.push(text);
        
        if (translations.length === 2) {
          expect(translations[0]).toBe('Cancel'); // English
          expect(translations[1]).toBe('Annuler'); // French
          done();
        }
      });
      
      // Change to French
      setTimeout(() => {
        service.setLanguage('fr');
        const req = httpMock.expectOne('/assets/i18n/fr.json');
        req.flush(mockFrenchTranslations);
      }, 100);
    });
  });

  describe('Current Language Observable', () => {
    it('should emit current language', (done) => {
      const req = httpMock.expectOne('/assets/i18n/en.json');
      req.flush(mockEnglishTranslations);
      
      service.currentLanguage$.subscribe(lang => {
        expect(lang).toBe('en');
        done();
      });
    });

    it('should emit when language changes', (done) => {
      const req1 = httpMock.expectOne('/assets/i18n/en.json');
      req1.flush(mockEnglishTranslations);
      
      const languages: Language[] = [];
      
      service.currentLanguage$.subscribe(lang => {
        languages.push(lang);
        
        if (languages.length === 2) {
          expect(languages[0]).toBe('en');
          expect(languages[1]).toBe('fr');
          done();
        }
      });
      
      setTimeout(() => {
        service.setLanguage('fr');
        const req2 = httpMock.expectOne('/assets/i18n/fr.json');
        req2.flush(mockFrenchTranslations);
      }, 100);
    });
  });

  describe('Error Handling', () => {
    it('should handle HTTP error when loading translations', () => {
      const consoleSpy = spyOn(console, 'error');
      
      const req = httpMock.expectOne('/assets/i18n/en.json');
      req.error(new ProgressEvent('error'), { status: 404, statusText: 'Not Found' });
      
      expect(consoleSpy).toHaveBeenCalled();
    });

    it('should fallback to default language if loading fails', (done) => {
      // Load English first
      const req1 = httpMock.expectOne('/assets/i18n/en.json');
      req1.flush(mockEnglishTranslations);
      
      // Try to load French but fail
      service.setLanguage('fr');
      const req2 = httpMock.expectOne('/assets/i18n/fr.json');
      req2.error(new ProgressEvent('error'), { status: 404, statusText: 'Not Found' });
      
      // Should fallback to English
      setTimeout(() => {
        const req3 = httpMock.expectOne('/assets/i18n/en.json');
        req3.flush(mockEnglishTranslations);
        
        setTimeout(() => {
          expect(service.getCurrentLanguage()).toBe('en');
          done();
        }, 100);
      }, 100);
    });
  });
});
