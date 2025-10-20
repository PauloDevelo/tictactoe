import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';
import { GameModeSelectorComponent } from './game-mode-selector.component';
import { GameMode } from '../../models/game-mode.model';
import { TranslationService } from '../../services/translation.service';

describe('GameModeSelectorComponent', () => {
  let component: GameModeSelectorComponent;
  let fixture: ComponentFixture<GameModeSelectorComponent>;
  let compiled: HTMLElement;
  let mockTranslationService: jasmine.SpyObj<TranslationService>;

  beforeEach(async () => {
    // Create mock translation service
    mockTranslationService = jasmine.createSpyObj('TranslationService', ['translate']);
    
    // Setup mock translations
    mockTranslationService.translate.and.callFake((key: string) => {
      const translations: Record<string, string> = {
        'gameMode.title': 'Choose Game Mode',
        'gameMode.local.title': 'Local Game',
        'gameMode.local.description': 'Play against a friend on the same device',
        'gameMode.ai.title': 'vs AI',
        'gameMode.ai.description': 'Challenge the computer opponent',
        'gameMode.online.title': 'Online Game',
        'gameMode.online.description': 'Play with friends over the internet'
      };
      return translations[key] || key;
    });

    await TestBed.configureTestingModule({
      imports: [GameModeSelectorComponent],
      providers: [
        { provide: TranslationService, useValue: mockTranslationService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(GameModeSelectorComponent);
    component = fixture.componentInstance;
    compiled = fixture.nativeElement;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Component Structure', () => {
    it('should display the selector title', () => {
      const title = compiled.querySelector('.selector-title');
      expect(title).toBeTruthy();
      expect(title?.textContent).toContain('Choose Game Mode');
    });

    it('should render three game mode cards', () => {
      const cards = compiled.querySelectorAll('.mode-card');
      expect(cards.length).toBe(3);
    });

    it('should display correct mode titles', () => {
      const titles = Array.from(compiled.querySelectorAll('.mode-title'))
        .map(el => el.textContent?.trim());
      
      expect(titles).toContain('Local Game');
      expect(titles).toContain('vs AI');
      expect(titles).toContain('Online Game');
    });

    it('should display mode icons', () => {
      const icons = compiled.querySelectorAll('.mode-icon');
      expect(icons.length).toBe(3);
      
      const iconTexts = Array.from(icons).map(el => el.textContent?.trim());
      expect(iconTexts).toContain('👥');
      expect(iconTexts).toContain('🤖');
      expect(iconTexts).toContain('🌐');
    });

    it('should display mode descriptions', () => {
      const descriptions = Array.from(compiled.querySelectorAll('.mode-description'))
        .map(el => el.textContent?.trim());
      
      expect(descriptions).toContain('Play against a friend on the same device');
      expect(descriptions).toContain('Challenge the computer opponent');
      expect(descriptions).toContain('Play with friends over the internet');
    });

    it('should have correct data-mode attributes', () => {
      const cards = compiled.querySelectorAll('.mode-card');
      const modes = Array.from(cards).map(card => card.getAttribute('data-mode'));
      
      expect(modes).toContain('local');
      expect(modes).toContain('ai');
      expect(modes).toContain('online');
    });
  });

  describe('Event Emission', () => {
    it('should emit modeSelected event when local mode card is clicked', (done) => {
      component.modeSelected.subscribe((mode: GameMode) => {
        expect(mode).toBe('local');
        done();
      });

      const localCard = compiled.querySelector('.mode-card[data-mode="local"]') as HTMLElement;
      localCard.click();
    });

    it('should emit modeSelected event when AI mode card is clicked', (done) => {
      component.modeSelected.subscribe((mode: GameMode) => {
        expect(mode).toBe('ai');
        done();
      });

      const aiCard = compiled.querySelector('.mode-card[data-mode="ai"]') as HTMLElement;
      aiCard.click();
    });

    it('should emit modeSelected event when online mode card is clicked', (done) => {
      component.modeSelected.subscribe((mode: GameMode) => {
        expect(mode).toBe('online');
        done();
      });

      const onlineCard = compiled.querySelector('.mode-card[data-mode="online"]') as HTMLElement;
      onlineCard.click();
    });

    it('should call selectMode method when card is clicked', () => {
      spyOn(component, 'selectMode');
      
      const localCard = compiled.querySelector('.mode-card[data-mode="local"]') as HTMLElement;
      localCard.click();
      
      expect(component.selectMode).toHaveBeenCalledWith('local');
    });
  });

  describe('Component Data', () => {
    it('should have gameModes array with three entries', () => {
      expect(component.gameModes.length).toBe(3);
    });

    it('should have correct structure for each game mode', () => {
      component.gameModes.forEach(gameMode => {
        expect(gameMode.mode).toBeDefined();
        expect(gameMode.titleKey).toBeDefined();
        expect(gameMode.descriptionKey).toBeDefined();
        expect(gameMode.icon).toBeDefined();
      });
    });

    it('should have local mode configuration', () => {
      const localMode = component.gameModes.find(m => m.mode === 'local');
      expect(localMode).toBeDefined();
      expect(localMode?.titleKey).toBe('gameMode.local.title');
      expect(localMode?.icon).toBe('👥');
    });

    it('should have AI mode configuration', () => {
      const aiMode = component.gameModes.find(m => m.mode === 'ai');
      expect(aiMode).toBeDefined();
      expect(aiMode?.titleKey).toBe('gameMode.ai.title');
      expect(aiMode?.icon).toBe('🤖');
    });

    it('should have online mode configuration', () => {
      const onlineMode = component.gameModes.find(m => m.mode === 'online');
      expect(onlineMode).toBeDefined();
      expect(onlineMode?.titleKey).toBe('gameMode.online.title');
      expect(onlineMode?.icon).toBe('🌐');
    });
  });

  describe('Accessibility', () => {
    it('should have clickable cards', () => {
      const cards = compiled.querySelectorAll('.mode-card');
      cards.forEach(card => {
        expect(card).toBeTruthy();
        expect(window.getComputedStyle(card).cursor).toBe('pointer');
      });
    });

    it('should have semantic heading structure', () => {
      const h2 = compiled.querySelector('h2.selector-title');
      const h3s = compiled.querySelectorAll('h3.mode-title');
      
      expect(h2).toBeTruthy();
      expect(h3s.length).toBe(3);
    });
  });
});
