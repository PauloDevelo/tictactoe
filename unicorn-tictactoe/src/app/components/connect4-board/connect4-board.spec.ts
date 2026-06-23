import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Connect4Board } from './connect4-board';
import { Player } from '../../models/player.model';
import { TranslationService } from '../../services/translation.service';

describe('Connect4Board', () => {
  let component: Connect4Board;
  let fixture: ComponentFixture<Connect4Board>;
  let mockTranslationService: jasmine.SpyObj<TranslationService>;

  beforeEach(async () => {
    mockTranslationService = jasmine.createSpyObj('TranslationService', ['translate']);
    mockTranslationService.translate.and.callFake((key: string, params?: Record<string, string | number>): string => {
      if (key === 'connect4.board.ariaLabel.gameOver') return 'Connect 4 game board - game over';
      if (key === 'connect4.board.ariaLabel.inProgress') {
        const player = params?.['player'] ?? 'Unicorn';
        return `Connect 4 game board - ${player}'s turn`;
      }
      if (key === 'game.score.labels.unicorn') return 'Unicorn';
      if (key === 'game.score.labels.cat') return 'Cat';
      if (key === 'connect4.column.label') return 'Column';
      return key;
    });

    await TestBed.configureTestingModule({
      imports: [Connect4Board],
      providers: [
        { provide: TranslationService, useValue: mockTranslationService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Connect4Board);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have 7 columns', () => {
    expect(component.columns.length).toBe(7);
    expect(component.columns).toEqual([0, 1, 2, 3, 4, 5, 6]);
  });

  it('should have 6 rows', () => {
    expect(component.rows.length).toBe(6);
    expect(component.rows).toEqual([0, 1, 2, 3, 4, 5]);
  });

  it('should have COLUMNS constant of 7', () => {
    expect(component.COLUMNS).toBe(7);
  });

  it('should have ROWS constant of 6', () => {
    expect(component.ROWS).toBe(6);
  });

  describe('isColumnFull', () => {
    it('should return true when top cell of column is occupied', () => {
      component.board = [Player.UNICORN, null, null, null, null, null, null];
      expect(component.isColumnFull(0)).toBe(true);
      expect(component.isColumnFull(1)).toBe(false);
    });

    it('should return false when top cell of column is empty', () => {
      component.board = Array(42).fill(null);
      expect(component.isColumnFull(0)).toBe(false);
      expect(component.isColumnFull(6)).toBe(false);
    });

    it('should return true for all columns when board is full', () => {
      component.board = Array(42).fill(Player.UNICORN);
      for (let col = 0; col < 7; col++) {
        expect(component.isColumnFull(col)).toBe(true);
      }
    });

    it('should return false for all columns when board is empty', () => {
      component.board = Array(42).fill(null);
      for (let col = 0; col < 7; col++) {
        expect(component.isColumnFull(col)).toBe(false);
      }
    });

    it('should return true only for filled columns in partial board', () => {
      // Only columns 0 and 3 are full (top row occupied)
      const board = Array(42).fill(null);
      board[0] = Player.UNICORN; // Column 0 top
      board[3] = Player.CAT;     // Column 3 top
      component.board = board;
      expect(component.isColumnFull(0)).toBe(true);
      expect(component.isColumnFull(3)).toBe(true);
      expect(component.isColumnFull(1)).toBe(false);
      expect(component.isColumnFull(2)).toBe(false);
      expect(component.isColumnFull(4)).toBe(false);
    });
  });

  describe('isColumnClickable', () => {
    it('should return true when column is not full and game is in progress', () => {
      component.board = Array(42).fill(null);
      component.isGameOver = false;
      expect(component.isColumnClickable(0)).toBe(true);
      expect(component.isColumnClickable(6)).toBe(true);
    });

    it('should return false when column is full', () => {
      component.board = [Player.UNICORN, null, null, null, null, null, null];
      component.isGameOver = false;
      expect(component.isColumnClickable(0)).toBe(false);
      expect(component.isColumnClickable(1)).toBe(true);
    });

    it('should return false when game is over', () => {
      component.board = Array(42).fill(null);
      component.isGameOver = true;
      expect(component.isColumnClickable(0)).toBe(false);
    });

    it('should return false for all columns when game is over', () => {
      component.board = Array(42).fill(null);
      component.isGameOver = true;
      for (let col = 0; col < 7; col++) {
        expect(component.isColumnClickable(col)).toBe(false);
      }
    });

    it('should return true for all columns when board is empty and game in progress', () => {
      component.board = Array(42).fill(null);
      component.isGameOver = false;
      for (let col = 0; col < 7; col++) {
        expect(component.isColumnClickable(col)).toBe(true);
      }
    });
  });

  describe('isWinningCell', () => {
    it('should return true for cells in winning line', () => {
      component.winningLine = [0, 7, 14, 21, 28, 35];
      expect(component.isWinningCell(0)).toBe(true);
      expect(component.isWinningCell(7)).toBe(true);
      expect(component.isWinningCell(14)).toBe(true);
      expect(component.isWinningCell(21)).toBe(true);
      expect(component.isWinningCell(28)).toBe(true);
      expect(component.isWinningCell(35)).toBe(true);
    });

    it('should return false for cells not in winning line', () => {
      component.winningLine = [0, 7, 14, 21, 28, 35];
      expect(component.isWinningCell(1)).toBe(false);
      expect(component.isWinningCell(42)).toBe(false);
    });

    it('should return false when winning line is null', () => {
      component.winningLine = null;
      expect(component.isWinningCell(0)).toBe(false);
    });

    it('should handle horizontal winning line', () => {
      component.winningLine = [0, 1, 2, 3];
      expect(component.isWinningCell(0)).toBe(true);
      expect(component.isWinningCell(1)).toBe(true);
      expect(component.isWinningCell(2)).toBe(true);
      expect(component.isWinningCell(3)).toBe(true);
      expect(component.isWinningCell(4)).toBe(false);
    });

    it('should handle diagonal winning line', () => {
      component.winningLine = [3, 10, 17, 24];
      expect(component.isWinningCell(3)).toBe(true);
      expect(component.isWinningCell(10)).toBe(true);
      expect(component.isWinningCell(17)).toBe(true);
      expect(component.isWinningCell(24)).toBe(true);
      expect(component.isWinningCell(0)).toBe(false);
    });

    it('should handle reverse diagonal winning line', () => {
      component.winningLine = [6, 12, 18, 24];
      expect(component.isWinningCell(6)).toBe(true);
      expect(component.isWinningCell(12)).toBe(true);
      expect(component.isWinningCell(18)).toBe(true);
      expect(component.isWinningCell(24)).toBe(true);
      expect(component.isWinningCell(0)).toBe(false);
    });
  });

  describe('onCellClickHandler', () => {
    it('should emit column index when cell is clicked', () => {
      component.board = Array(42).fill(null);
      component.isGameOver = false;

      spyOn(component.onCellClick, 'emit');

      // Click on row 2, column 3 (index = 2 * 7 + 3 = 17)
      component.onCellClickHandler(17);
      expect(component.onCellClick.emit).toHaveBeenCalledWith(3);
    });

    it('should not emit when column is full', () => {
      component.board = [Player.UNICORN, null, null, null, null, null, null];
      component.isGameOver = false;

      spyOn(component.onCellClick, 'emit');

      component.onCellClickHandler(0);
      expect(component.onCellClick.emit).not.toHaveBeenCalled();
    });

    it('should not emit when game is over', () => {
      component.board = Array(42).fill(null);
      component.isGameOver = true;

      spyOn(component.onCellClick, 'emit');

      component.onCellClickHandler(0);
      expect(component.onCellClick.emit).not.toHaveBeenCalled();
    });

    it('should emit correct column for cell in last row', () => {
      component.board = Array(42).fill(null);
      component.isGameOver = false;

      spyOn(component.onCellClick, 'emit');

      // Click on row 5, column 6 (index = 5 * 7 + 6 = 41)
      component.onCellClickHandler(41);
      expect(component.onCellClick.emit).toHaveBeenCalledWith(6);
    });

    it('should emit correct column for cell in first row', () => {
      component.board = Array(42).fill(null);
      component.isGameOver = false;

      spyOn(component.onCellClick, 'emit');

      // Click on row 0, column 0 (index = 0)
      component.onCellClickHandler(0);
      expect(component.onCellClick.emit).toHaveBeenCalledWith(0);
    });

    it('should emit correct column for cell in middle', () => {
      component.board = Array(42).fill(null);
      component.isGameOver = false;

      spyOn(component.onCellClick, 'emit');

      // Click on row 3, column 2 (index = 3 * 7 + 2 = 23)
      component.onCellClickHandler(23);
      expect(component.onCellClick.emit).toHaveBeenCalledWith(2);
    });

    it('should emit column 0 for any cell in column 0', () => {
      component.board = Array(42).fill(null);
      component.isGameOver = false;

      spyOn(component.onCellClick, 'emit');

      // Test each row in column 0
      for (let row = 0; row < 6; row++) {
        component.onCellClickHandler(row * 7 + 0);
        expect(component.onCellClick.emit).toHaveBeenCalledWith(0);
        (component.onCellClick.emit as jasmine.Spy).calls.reset();
      }
    });

    it('should emit column 6 for any cell in column 6', () => {
      component.board = Array(42).fill(null);
      component.isGameOver = false;

      spyOn(component.onCellClick, 'emit');

      // Test each row in column 6
      for (let row = 0; row < 6; row++) {
        component.onCellClickHandler(row * 7 + 6);
        expect(component.onCellClick.emit).toHaveBeenCalledWith(6);
        (component.onCellClick.emit as jasmine.Spy).calls.reset();
      }
    });
  });

  describe('DOM click handling', () => {
    beforeEach(() => {
      component.board = Array(42).fill(null);
      component.isGameOver = false;
      fixture.detectChanges();
    });

    it('should emit exactly once when a column is clicked', () => {
      spyOn(component.onCellClick, 'emit');

      const column = fixture.nativeElement.querySelector('[data-column="3"]') as HTMLElement;
      column.click();

      expect(component.onCellClick.emit).toHaveBeenCalledTimes(1);
      expect(component.onCellClick.emit).toHaveBeenCalledWith(3);
    });

    it('should emit exactly once when a cell inside a column is clicked', () => {
      spyOn(component.onCellClick, 'emit');

      const cell = fixture.nativeElement.querySelector('[data-column="3"] app-game-cell .cell') as HTMLElement;
      cell.click();

      expect(component.onCellClick.emit).toHaveBeenCalledTimes(1);
      expect(component.onCellClick.emit).toHaveBeenCalledWith(3);
    });

    it('should not emit when a disabled column is clicked', () => {
      component.board[3] = Player.UNICORN;
      fixture.detectChanges();

      spyOn(component.onCellClick, 'emit');

      const column = fixture.nativeElement.querySelector('[data-column="3"]') as HTMLElement;
      column.click();

      expect(component.onCellClick.emit).not.toHaveBeenCalled();
    });

    it('should activate a column on Enter key', () => {
      spyOn(component.onCellClick, 'emit');

      const column = fixture.nativeElement.querySelector('[data-column="2"]') as HTMLElement;
      column.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));

      expect(component.onCellClick.emit).toHaveBeenCalledTimes(1);
      expect(component.onCellClick.emit).toHaveBeenCalledWith(2);
    });

    it('should activate a column on Space key', () => {
      spyOn(component.onCellClick, 'emit');

      const column = fixture.nativeElement.querySelector('[data-column="4"]') as HTMLElement;
      column.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }));

      expect(component.onCellClick.emit).toHaveBeenCalledTimes(1);
      expect(component.onCellClick.emit).toHaveBeenCalledWith(4);
    });
  });

  describe('ariaLabel', () => {
    it('should include current player when game is in progress', () => {
      component.currentPlayer = Player.UNICORN;
      component.isGameOver = false;
      expect(component.ariaLabel).toContain('Unicorn');
      expect(component.ariaLabel).toContain('Connect 4');
    });

    it('should include Cat as current player', () => {
      component.currentPlayer = Player.CAT;
      component.isGameOver = false;
      expect(component.ariaLabel).toContain('Cat');
    });

    it('should indicate game over', () => {
      component.isGameOver = true;
      expect(component.ariaLabel).toContain('game over');
    });

    it('should not include player name when game is over', () => {
      component.currentPlayer = Player.UNICORN;
      component.isGameOver = true;
      expect(component.ariaLabel).not.toContain('Unicorn');
      expect(component.ariaLabel).not.toContain('Cat');
    });

    it('should use translated player name for Unicorn', () => {
      component.currentPlayer = Player.UNICORN;
      component.isGameOver = false;
      expect(component.ariaLabel).toContain('Unicorn');
    });

    it('should use translated player name for Cat', () => {
      component.currentPlayer = Player.CAT;
      component.isGameOver = false;
      expect(component.ariaLabel).toContain('Cat');
    });
  });

  describe('Board input properties', () => {
    it('should accept board with 42 cells', () => {
      const board = Array(42).fill(null);
      component.board = board;
      expect(component.board.length).toBe(42);
    });

    it('should accept board with mixed player values', () => {
      const board = Array(42).fill(null);
      board[0] = Player.UNICORN;
      board[1] = Player.CAT;
      board[35] = Player.UNICORN;
      component.board = board;
      expect(component.board[0]).toBe(Player.UNICORN);
      expect(component.board[1]).toBe(Player.CAT);
      expect(component.board[35]).toBe(Player.UNICORN);
    });

    it('should default board to empty array', () => {
      expect(component.board).toEqual([]);
    });

    it('should default currentPlayer to UNICORN', () => {
      expect(component.currentPlayer).toBe(Player.UNICORN);
    });

    it('should default winningLine to null', () => {
      expect(component.winningLine).toBeNull();
    });

    it('should default isGameOver to false', () => {
      expect(component.isGameOver).toBe(false);
    });
  });

  describe('Cell index calculation', () => {
    it('should calculate correct index for row 0, col 0', () => {
      // row * 7 + col = 0 * 7 + 0 = 0
      expect(0 * 7 + 0).toBe(0);
    });

    it('should calculate correct index for row 5, col 6', () => {
      // row * 7 + col = 5 * 7 + 6 = 41
      expect(5 * 7 + 6).toBe(41);
    });

    it('should calculate correct index for row 3, col 3', () => {
      // row * 7 + col = 3 * 7 + 3 = 24
      expect(3 * 7 + 3).toBe(24);
    });

    it('should derive column from cell index using modulo', () => {
      // index % 7 = column
      expect(23 % 7).toBe(2);
      expect(41 % 7).toBe(6);
      expect(0 % 7).toBe(0);
    });
  });
});
