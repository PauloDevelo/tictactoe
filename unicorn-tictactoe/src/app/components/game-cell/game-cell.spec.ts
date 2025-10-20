import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GameCell } from './game-cell';
import { Player } from '../../models/player.model';

describe('GameCell', () => {
  let component: GameCell;
  let fixture: ComponentFixture<GameCell>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GameCell]
    }).compileComponents();

    fixture = TestBed.createComponent(GameCell);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Display Icons', () => {
    it('should display unicorn icon when player is UNICORN', () => {
      component.player = Player.UNICORN;
      expect(component.displayIcon).toBe('🦄');
    });

    it('should display cat icon when player is CAT', () => {
      component.player = Player.CAT;
      expect(component.displayIcon).toBe('🐱');
    });

    it('should display empty string when no player', () => {
      component.player = null;
      expect(component.displayIcon).toBe('');
    });
  });

  describe('Preview Icons', () => {
    it('should show unicorn preview when current player is UNICORN and cell is empty', () => {
      component.player = null;
      component.currentPlayer = Player.UNICORN;
      component.isGameOver = false;
      expect(component.previewIcon).toBe('🦄');
    });

    it('should show cat preview when current player is CAT and cell is empty', () => {
      component.player = null;
      component.currentPlayer = Player.CAT;
      component.isGameOver = false;
      expect(component.previewIcon).toBe('🐱');
    });

    it('should not show preview when cell is occupied', () => {
      component.player = Player.UNICORN;
      component.currentPlayer = Player.CAT;
      expect(component.previewIcon).toBe('');
    });

    it('should not show preview when game is over', () => {
      component.player = null;
      component.isGameOver = true;
      expect(component.previewIcon).toBe('');
    });
  });

  describe('Disabled State', () => {
    it('should be disabled when cell is occupied', () => {
      component.player = Player.UNICORN;
      component.isGameOver = false;
      expect(component.isDisabled).toBe(true);
    });

    it('should be disabled when game is over', () => {
      component.player = null;
      component.isGameOver = true;
      expect(component.isDisabled).toBe(true);
    });

    it('should not be disabled when cell is empty and game is in progress', () => {
      component.player = null;
      component.isGameOver = false;
      expect(component.isDisabled).toBe(false);
    });
  });

  describe('Click Events', () => {
    it('should emit cellClicked when clicked and not disabled', () => {
      spyOn(component.cellClicked, 'emit');
      component.player = null;
      component.isGameOver = false;

      component.onClick();

      expect(component.cellClicked.emit).toHaveBeenCalled();
    });

    it('should not emit cellClicked when disabled', () => {
      spyOn(component.cellClicked, 'emit');
      component.player = Player.UNICORN;

      component.onClick();

      expect(component.cellClicked.emit).not.toHaveBeenCalled();
    });
  });

  describe('Keyboard Events', () => {
    it('should emit cellClicked on Enter key when not disabled', () => {
      spyOn(component.cellClicked, 'emit');
      component.player = null;
      component.isGameOver = false;

      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      spyOn(event, 'preventDefault');
      component.onKeyPress(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(component.cellClicked.emit).toHaveBeenCalled();
    });

    it('should emit cellClicked on Space key when not disabled', () => {
      spyOn(component.cellClicked, 'emit');
      component.player = null;
      component.isGameOver = false;

      const event = new KeyboardEvent('keydown', { key: ' ' });
      spyOn(event, 'preventDefault');
      component.onKeyPress(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(component.cellClicked.emit).toHaveBeenCalled();
    });

    it('should not emit cellClicked on key press when disabled', () => {
      spyOn(component.cellClicked, 'emit');
      component.player = Player.UNICORN;

      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      component.onKeyPress(event);

      expect(component.cellClicked.emit).not.toHaveBeenCalled();
    });
  });

  describe('ARIA Labels', () => {
    it('should provide correct aria label for empty cell', () => {
      component.cellIndex = 0;
      component.player = null;
      component.currentPlayer = Player.UNICORN;
      component.isGameOver = false;

      expect(component.ariaLabel).toBe('Cell 1, empty, click to place Unicorn');
    });

    it('should provide correct aria label for occupied cell with Unicorn', () => {
      component.cellIndex = 4;
      component.player = Player.UNICORN;

      expect(component.ariaLabel).toBe('Cell 5, occupied by Unicorn');
    });

    it('should provide correct aria label for occupied cell with Cat', () => {
      component.cellIndex = 8;
      component.player = Player.CAT;

      expect(component.ariaLabel).toBe('Cell 9, occupied by Cat');
    });

    it('should provide correct aria label when game is over', () => {
      component.cellIndex = 2;
      component.player = null;
      component.isGameOver = true;

      expect(component.ariaLabel).toBe('Cell 3, empty, game over');
    });

    it('should indicate Cat turn in aria label', () => {
      component.cellIndex = 5;
      component.player = null;
      component.currentPlayer = Player.CAT;
      component.isGameOver = false;

      expect(component.ariaLabel).toBe('Cell 6, empty, click to place Cat');
    });
  });

  describe('Rendering', () => {
    it('should render with correct role', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const cell = compiled.querySelector('.cell');
      expect(cell?.getAttribute('role')).toBe('gridcell');
    });

    it('should have tabindex 0 when not disabled', () => {
      component.player = null;
      component.isGameOver = false;
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const cell = compiled.querySelector('.cell');
      expect(cell?.getAttribute('tabindex')).toBe('0');
    });

    it('should have tabindex -1 when disabled', () => {
      component.player = Player.UNICORN;
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const cell = compiled.querySelector('.cell');
      expect(cell?.getAttribute('tabindex')).toBe('-1');
    });
  });
});
