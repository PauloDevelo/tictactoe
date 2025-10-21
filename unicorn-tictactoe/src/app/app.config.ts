import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection, APP_INITIALIZER } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { TranslationService } from './services/translation.service';
import { firstValueFrom } from 'rxjs';

export function initializeApp(translationService: TranslationService) {
  return () => {
    const detectedLanguage = translationService.detectBrowserLanguage();
    return firstValueFrom(translationService.loadTranslationsSync(detectedLanguage.normalized));
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideHttpClient(),
    {
      provide: APP_INITIALIZER,
      useFactory: initializeApp,
      deps: [TranslationService],
      multi: true
    }
  ]
};
