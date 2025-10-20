import { TestBed } from '@angular/core/testing';
import { App } from './app';
import { TranslationService } from './services/translation.service';
import { BehaviorSubject } from 'rxjs';

describe('App', () => {
  let mockTranslationService: jasmine.SpyObj<TranslationService>;
  let currentLanguageSubject: BehaviorSubject<'en' | 'fr'>;

  beforeEach(async () => {
    // Create a BehaviorSubject for currentLanguage$
    currentLanguageSubject = new BehaviorSubject<'en' | 'fr'>('en');

    // Create mock TranslationService
    mockTranslationService = jasmine.createSpyObj('TranslationService', [
      'getCurrentLanguage',
      'setLanguage',
      'translate',
      'detectBrowserLanguage'
    ], {
      currentLanguage$: currentLanguageSubject.asObservable()
    });
    
    mockTranslationService.getCurrentLanguage.and.returnValue('en');
    mockTranslationService.translate.and.returnValue('Translated Text');
    mockTranslationService.detectBrowserLanguage.and.returnValue({
      detected: 'en-US',
      normalized: 'en',
      fallback: false
    });

    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        { provide: TranslationService, useValue: mockTranslationService }
      ]
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render title', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('🦄 Unicorn Tic-Tac-Toe 🐱');
  });
});
