import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GameTypeSelectorComponent } from './game-type-selector.component';
import { GameService } from '../../services/game.service';
import { TranslationService } from '../../services/translation.service';
import { GameType } from '../../models/game-type.model';

describe('GameTypeSelectorComponent', () => {
  let component: GameTypeSelectorComponent;
  let fixture: ComponentFixture<GameTypeSelectorComponent>;
  let mockGameService: jasmine.SpyObj<GameService>;
  let mockTranslationService: jasmine.SpyObj<TranslationService>;

  beforeEach(async () => {
    mockGameService = jasmine.createSpyObj('GameService', ['getGameType', 'setGameType']);
    mockGameService.getGameType.and.returnValue('tictactoe');

    mockTranslationService = jasmine.createSpyObj('TranslationService', ['translate']);
    mockTranslationService.translate.and.callFake((key: string, params?: Record<string, string | number>): string => {
      if (key === 'gameTypeSelector.title') return 'Choose your game';
      if (key === 'gameType.tictactoe') return 'Tic-Tac-Toe';
      if (key === 'gameType.connect4') return 'Connect 4';
      return key;
    });

    await TestBed.configureTestingModule({
      imports: [GameTypeSelectorComponent],
      providers: [
        { provide: GameService, useValue: mockGameService },
        { provide: TranslationService, useValue: mockTranslationService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(GameTypeSelectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have two game types', () => {
    expect(component.gameTypes.length).toBe(2);
    expect(component.gameTypes[0].type).toBe('tictactoe');
    expect(component.gameTypes[1].type).toBe('connect4');
  });

  it('should return selected type from GameService', () => {
    expect(component.selectedType).toBe('tictactoe');
  });

  it('should call setGameType and emit when selecting a game type', () => {
    const newType: GameType = 'connect4';
    spyOn(component.gameTypeSelected, 'emit');

    component.selectGameType(newType);

    expect(mockGameService.setGameType).toHaveBeenCalledWith(newType);
    expect(component.gameTypeSelected.emit).toHaveBeenCalledWith(newType);
  });

  it('should return translated selector title', () => {
    expect(component.selectorTitle).toBe('Choose your game');
  });

  it('should return translated game type label for tictactoe', () => {
    expect(component.getGameTypeLabel('tictactoe')).toBe('Tic-Tac-Toe');
  });

  it('should return translated game type label for connect4', () => {
    expect(component.getGameTypeLabel('connect4')).toBe('Connect 4');
  });

  describe('Game type selection events', () => {
    it('should emit tictactoe when selecting Tic-Tac-Toe', () => {
      spyOn(component.gameTypeSelected, 'emit');
      component.selectGameType('tictactoe');
      expect(component.gameTypeSelected.emit).toHaveBeenCalledWith('tictactoe');
    });

    it('should emit connect4 when selecting Connect 4', () => {
      spyOn(component.gameTypeSelected, 'emit');
      component.selectGameType('connect4');
      expect(component.gameTypeSelected.emit).toHaveBeenCalledWith('connect4');
    });

    it('should call setGameType for each selection', () => {
      component.selectGameType('connect4');
      expect(mockGameService.setGameType).toHaveBeenCalledWith('connect4');

      component.selectGameType('tictactoe');
      expect(mockGameService.setGameType).toHaveBeenCalledWith('tictactoe');
    });

    it('should allow toggling between game types', () => {
      spyOn(component.gameTypeSelected, 'emit');

      component.selectGameType('connect4');
      expect(component.gameTypeSelected.emit).toHaveBeenCalledWith('connect4');

      component.selectGameType('tictactoe');
      expect(component.gameTypeSelected.emit).toHaveBeenCalledWith('tictactoe');

      component.selectGameType('connect4');
      expect(component.gameTypeSelected.emit).toHaveBeenCalledWith('connect4');
    });
  });

  describe('Game type properties', () => {
    it('should have correct label keys for each game type', () => {
      expect(component.gameTypes[0].labelKey).toBe('gameType.tictactoe');
      expect(component.gameTypes[1].labelKey).toBe('gameType.connect4');
    });

    it('should have icons for each game type', () => {
      expect(component.gameTypes[0].icon).toBeDefined();
      expect(component.gameTypes[1].icon).toBeDefined();
      expect(component.gameTypes[0].icon).not.toBe(component.gameTypes[1].icon);
    });

    it('should return correct selected type when GameService returns connect4', () => {
      mockGameService.getGameType.and.returnValue('connect4');
      expect(component.selectedType).toBe('connect4');
    });
  });

  describe('DOM rendering', () => {
    it('should render the selector container with correct class', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const selector = compiled.querySelector('.game-type-selector');
      expect(selector).toBeTruthy();
    });

    it('should render the selector title with icon', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const title = compiled.querySelector('.selector-label');
      expect(title).toBeTruthy();
      expect(title?.textContent).toContain('🎮');
      expect(title?.textContent).toContain('Choose your game');
    });

    it('should render two type options', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const options = compiled.querySelectorAll('.type-option');
      expect(options.length).toBe(2);
    });

    it('should render radio inputs for each game type', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const radios = compiled.querySelectorAll('input[type="radio"]');
      expect(radios.length).toBe(2);
    });

    it('should have radio inputs with name "gameType"', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const radios = compiled.querySelectorAll('input[type="radio"]');
      radios.forEach(radio => {
        expect(radio.getAttribute('name')).toBe('gameType');
      });
    });

    it('should have the first radio (tictactoe) checked by default', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const radios = compiled.querySelectorAll<HTMLInputElement>('input[type="radio"]');
      expect(radios[0].checked).toBe(true);
      expect(radios[1].checked).toBe(false);
    });

    it('should mark the selected type option with "selected" class', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const options = compiled.querySelectorAll('.type-option');
      expect(options[0].classList.contains('selected')).toBe(true);
      expect(options[1].classList.contains('selected')).toBe(false);
    });

    it('should render type labels with translated text', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const labels = compiled.querySelectorAll('.type-label');
      expect(labels[0].textContent).toBe('Tic-Tac-Toe');
      expect(labels[1].textContent).toBe('Connect 4');
    });

    it('should render type icons', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const icons = compiled.querySelectorAll('.type-icon');
      expect(icons.length).toBe(2);
      expect(icons[0].textContent).toBe('❌⭕');
      expect(icons[1].textContent).toBe('🔴🟡');
    });

    it('should mark Connect 4 option as selected when gameType is connect4', () => {
      mockGameService.getGameType.and.returnValue('connect4');
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const options = compiled.querySelectorAll('.type-option');
      expect(options[0].classList.contains('selected')).toBe(false);
      expect(options[1].classList.contains('selected')).toBe(true);
    });
  });
});
