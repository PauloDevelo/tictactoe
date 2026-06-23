import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { AiService } from './ai.service';
import { GameService } from './game.service';
import { GameState } from '../models/game-state.model';
import { Player } from '../models/player.model';
import { GameStatus } from '../models/game-status.enum';

describe('AiService', () => {
  let service: AiService;
  let gameServiceSpy: jasmine.SpyObj<GameService>;

  function createState(overrides: Partial<GameState> = {}): GameState {
    return {
      board: Array(9).fill(null),
      currentPlayer: Player.CAT,
      status: GameStatus.IN_PROGRESS,
      scores: { unicorn: 0, cat: 0 },
      winningLine: null,
      ...overrides
    };
  }

  beforeEach(() => {
    gameServiceSpy = jasmine.createSpyObj('GameService', [
      'getCurrentState',
      'makeMove',
      'getGameType'
    ]);
    gameServiceSpy.getGameType.and.returnValue('tictactoe');

    TestBed.configureTestingModule({
      providers: [AiService, { provide: GameService, useValue: gameServiceSpy }]
    });
    service = TestBed.inject(AiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('computeMove - turn validation', () => {
    it('should return -1 when it is not the AI turn', () => {
      const state = createState({ currentPlayer: Player.UNICORN });
      expect(service.computeMove('tictactoe', state)).toBe(-1);
    });

    it('should return -1 when the game is over', () => {
      const state = createState({ status: GameStatus.UNICORN_WINS });
      expect(service.computeMove('tictactoe', state)).toBe(-1);
    });
  });

  describe('computeMove - Tic-Tac-Toe', () => {
    it('should take an immediate winning move', () => {
      // CAT has 0 and 1, should play 2 to win
      const board = Array(9).fill(null);
      board[0] = Player.CAT;
      board[1] = Player.CAT;
      board[3] = Player.UNICORN;
      const state = createState({ board });
      expect(service.computeMove('tictactoe', state)).toBe(2);
    });

    it('should block opponent immediate winning move', () => {
      // UNICORN has 0 and 1, CAT should block 2
      const board = Array(9).fill(null);
      board[0] = Player.UNICORN;
      board[1] = Player.UNICORN;
      board[3] = Player.CAT;
      const state = createState({ board });
      expect(service.computeMove('tictactoe', state)).toBe(2);
    });

    it('should prefer winning over blocking', () => {
      const board = Array(9).fill(null);
      // CAT can win by playing 2 (0,1,2)
      board[0] = Player.CAT;
      board[1] = Player.CAT;
      // UNICORN can win by playing 5 (3,4,5)
      board[3] = Player.UNICORN;
      board[4] = Player.UNICORN;
      const state = createState({ board });
      expect(service.computeMove('tictactoe', state)).toBe(2);
    });

    it('should prefer the center on an empty board', () => {
      const state = createState({ board: Array(9).fill(null) });
      expect(service.computeMove('tictactoe', state)).toBe(4);
    });

    it('should prefer a corner when center is taken', () => {
      const board = Array(9).fill(null);
      board[4] = Player.UNICORN;
      const state = createState({ board });
      expect([0, 2, 6, 8]).toContain(service.computeMove('tictactoe', state));
    });

    it('should choose any valid move when only edges remain', () => {
      const board = Array(9).fill(null);
      board[4] = Player.UNICORN;
      board[0] = Player.CAT;
      board[2] = Player.UNICORN;
      board[6] = Player.CAT;
      board[8] = Player.UNICORN;
      const state = createState({ board });
      const move = service.computeMove('tictactoe', state);
      expect([1, 3, 5, 7]).toContain(move);
    });

    it('should return -1 when the board is full', () => {
      const board = Array(9).fill(Player.UNICORN);
      const state = createState({ board });
      expect(service.computeMove('tictactoe', state)).toBe(-1);
    });
  });

  describe('computeMove - Connect 4', () => {
    it('should take an immediate horizontal winning move', () => {
      const board = Array(42).fill(null);
      // Bottom row: CAT CAT CAT _ in columns 0-3
      board[35] = Player.CAT;
      board[36] = Player.CAT;
      board[37] = Player.CAT;
      const state = createState({ board });
      expect(service.computeMove('connect4', state)).toBe(3);
    });

    it('should take an immediate vertical winning move', () => {
      const board = Array(42).fill(null);
      // Column 0 rows 5,4,3 have CAT
      board[35] = Player.CAT;
      board[28] = Player.CAT;
      board[21] = Player.CAT;
      const state = createState({ board });
      expect(service.computeMove('connect4', state)).toBe(0);
    });

    it('should block opponent immediate winning move', () => {
      const board = Array(42).fill(null);
      // Bottom row: UNICORN UNICORN UNICORN _ in columns 0-3
      board[35] = Player.UNICORN;
      board[36] = Player.UNICORN;
      board[37] = Player.UNICORN;
      const state = createState({ board });
      expect(service.computeMove('connect4', state)).toBe(3);
    });

    it('should prefer the center column on an empty board', () => {
      const state = createState({ board: Array(42).fill(null) });
      expect(service.computeMove('connect4', state)).toBe(3);
    });

    it('should avoid full columns', () => {
      const board = Array(42).fill(null);
      // Fill center column 3 with alternating pieces (no 4-in-a-row)
      for (let row = 0; row < 6; row++) {
        board[row * 7 + 3] = row % 2 === 0 ? Player.UNICORN : Player.CAT;
      }
      const state = createState({ board });
      const move = service.computeMove('connect4', state);
      expect(move).not.toBe(3);
      expect(move).toBeGreaterThanOrEqual(0);
      expect(move).toBeLessThan(7);
    });

    it('should prefer columns closer to the center when center is full', () => {
      const board = Array(42).fill(null);
      // Fill center column 3 with alternating pieces (no 4-in-a-row)
      for (let row = 0; row < 6; row++) {
        board[row * 7 + 3] = row % 2 === 0 ? Player.UNICORN : Player.CAT;
      }
      const state = createState({ board });
      // Next best are columns 2 and 4 (score 7)
      expect([2, 4]).toContain(service.computeMove('connect4', state));
    });
  });

  describe('scheduleMove', () => {
    it('should call gameService.makeMove after the delay', fakeAsync(() => {
      gameServiceSpy.getGameType.and.returnValue('tictactoe');
      gameServiceSpy.getCurrentState.and.returnValue(
        createState({ board: Array(9).fill(null) })
      );

      service.scheduleMove(500);
      expect(gameServiceSpy.makeMove).not.toHaveBeenCalled();

      tick(500);
      expect(gameServiceSpy.makeMove).toHaveBeenCalledTimes(1);
      expect(gameServiceSpy.makeMove).toHaveBeenCalledWith(4);
    }));

    it('should not call makeMove when cancelled before the delay', fakeAsync(() => {
      gameServiceSpy.getGameType.and.returnValue('tictactoe');
      gameServiceSpy.getCurrentState.and.returnValue(
        createState({ board: Array(9).fill(null) })
      );

      const cancel = service.scheduleMove(500);
      cancel();

      tick(500);
      expect(gameServiceSpy.makeMove).not.toHaveBeenCalled();
    }));

    it('should not call makeMove when it is no longer the AI turn after the delay', fakeAsync(() => {
      gameServiceSpy.getGameType.and.returnValue('tictactoe');
      const aiTurnState = createState({ board: Array(9).fill(null) });
      const humanTurnState = createState({
        currentPlayer: Player.UNICORN,
        board: Array(9).fill(null)
      });

      gameServiceSpy.getCurrentState.and.returnValues(aiTurnState, humanTurnState);

      service.scheduleMove(500);
      tick(500);

      expect(gameServiceSpy.makeMove).not.toHaveBeenCalled();
    }));

    it('should return a no-op cancel function when it is not the AI turn', () => {
      gameServiceSpy.getCurrentState.and.returnValue(
        createState({ currentPlayer: Player.UNICORN })
      );

      const cancel = service.scheduleMove(500);
      expect(() => cancel()).not.toThrow();
    });

    it('should not call makeMove when the game is over', fakeAsync(() => {
      gameServiceSpy.getGameType.and.returnValue('tictactoe');
      gameServiceSpy.getCurrentState.and.returnValue(
        createState({ status: GameStatus.UNICORN_WINS, board: Array(9).fill(null) })
      );

      service.scheduleMove(500);
      tick(500);

      expect(gameServiceSpy.makeMove).not.toHaveBeenCalled();
    }));
  });
});
