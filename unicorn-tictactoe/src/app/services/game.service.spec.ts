import { TestBed } from '@angular/core/testing';
import { GameService } from './game.service';
import { Player } from '../models/player.model';
import { GameStatus } from '../models/game-status.enum';

describe('GameService', () => {
  let service: GameService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GameService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Initial State', () => {
    it('should initialize with empty board (9 null cells)', (done) => {
      service.gameState$.subscribe(state => {
        expect(state.board.length).toBe(9);
        expect(state.board.every(cell => cell === null)).toBe(true);
        done();
      });
    });

    it('should initialize with UNICORN as current player', (done) => {
      service.gameState$.subscribe(state => {
        expect(state.currentPlayer).toBe(Player.UNICORN);
        done();
      });
    });

    it('should initialize with IN_PROGRESS status', (done) => {
      service.gameState$.subscribe(state => {
        expect(state.status).toBe(GameStatus.IN_PROGRESS);
        done();
      });
    });

    it('should initialize with scores at 0', (done) => {
      service.gameState$.subscribe(state => {
        expect(state.scores.unicorn).toBe(0);
        expect(state.scores.cat).toBe(0);
        done();
      });
    });

    it('should initialize with no winning line', (done) => {
      service.gameState$.subscribe(state => {
        expect(state.winningLine).toBeNull();
        done();
      });
    });
  });

  describe('resetGame()', () => {
    it('should reset board to empty', () => {
      // Manually set some board state
      const currentState = service.getCurrentState();
      currentState.board[0] = Player.UNICORN;
      currentState.board[4] = Player.CAT;
      
      service.resetGame();
      
      const newState = service.getCurrentState();
      expect(newState.board.every(cell => cell === null)).toBe(true);
    });

    it('should reset to UNICORN as current player', () => {
      const currentState = service.getCurrentState();
      currentState.currentPlayer = Player.CAT;
      
      service.resetGame();
      
      const newState = service.getCurrentState();
      expect(newState.currentPlayer).toBe(Player.UNICORN);
    });

    it('should reset status to IN_PROGRESS', () => {
      const currentState = service.getCurrentState();
      currentState.status = GameStatus.UNICORN_WINS;
      
      service.resetGame();
      
      const newState = service.getCurrentState();
      expect(newState.status).toBe(GameStatus.IN_PROGRESS);
    });

    it('should preserve scores when resetting', () => {
      const currentState = service.getCurrentState();
      currentState.scores.unicorn = 3;
      currentState.scores.cat = 2;
      
      service.resetGame();
      
      const newState = service.getCurrentState();
      expect(newState.scores.unicorn).toBe(3);
      expect(newState.scores.cat).toBe(2);
    });

    it('should clear winning line', () => {
      const currentState = service.getCurrentState();
      currentState.winningLine = [0, 1, 2];
      
      service.resetGame();
      
      const newState = service.getCurrentState();
      expect(newState.winningLine).toBeNull();
    });
  });

  describe('initializeGame()', () => {
    it('should reset board to empty', () => {
      service.initializeGame();
      
      const state = service.getCurrentState();
      expect(state.board.every(cell => cell === null)).toBe(true);
    });

    it('should reset scores to 0', () => {
      const currentState = service.getCurrentState();
      currentState.scores.unicorn = 5;
      currentState.scores.cat = 3;
      
      service.initializeGame();
      
      const state = service.getCurrentState();
      expect(state.scores.unicorn).toBe(0);
      expect(state.scores.cat).toBe(0);
    });

    it('should set status to IN_PROGRESS', () => {
      service.initializeGame();
      
      const state = service.getCurrentState();
      expect(state.status).toBe(GameStatus.IN_PROGRESS);
    });

    it('should set current player to UNICORN', () => {
      service.initializeGame();
      
      const state = service.getCurrentState();
      expect(state.currentPlayer).toBe(Player.UNICORN);
    });
  });

  describe('Observable Pattern', () => {
    it('should emit new state when updated', (done) => {
      let emissionCount = 0;
      
      service.gameState$.subscribe(() => {
        emissionCount++;
        if (emissionCount === 2) {
          // First emission is initial state, second is after reset
          done();
        }
      });
      
      service.resetGame();
    });
  });
});

describe('GameService - Move Logic', () => {
  let service: GameService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GameService);
    service.initializeGame();
  });

  describe('makeMove()', () => {
    it('should place UNICORN on empty cell', () => {
      const result = service.makeMove(0);
      
      expect(result).toBe(true);
      const state = service.getCurrentState();
      expect(state.board[0]).toBe(Player.UNICORN);
    });

    it('should switch to CAT after UNICORN moves', () => {
      service.makeMove(0);
      
      const state = service.getCurrentState();
      expect(state.currentPlayer).toBe(Player.CAT);
    });

    it('should place CAT on empty cell after turn switch', () => {
      service.makeMove(0); // UNICORN
      service.makeMove(1); // CAT
      
      const state = service.getCurrentState();
      expect(state.board[1]).toBe(Player.CAT);
    });

    it('should switch back to UNICORN after CAT moves', () => {
      service.makeMove(0); // UNICORN
      service.makeMove(1); // CAT
      
      const state = service.getCurrentState();
      expect(state.currentPlayer).toBe(Player.UNICORN);
    });

    it('should return false when trying to place on occupied cell', () => {
      service.makeMove(0); // UNICORN
      const result = service.makeMove(0); // Try again
      
      expect(result).toBe(false);
    });

    it('should not change board when move is invalid', () => {
      service.makeMove(0); // UNICORN
      const stateBefore = service.getCurrentState().board[0];
      
      service.makeMove(0); // Invalid move
      
      const stateAfter = service.getCurrentState().board[0];
      expect(stateAfter).toBe(stateBefore);
      expect(stateAfter).toBe(Player.UNICORN);
    });

    it('should not switch player when move is invalid', () => {
      service.makeMove(0); // UNICORN moves, now CAT's turn
      const playerBefore = service.getCurrentState().currentPlayer;
      
      service.makeMove(0); // Invalid move
      
      const playerAfter = service.getCurrentState().currentPlayer;
      expect(playerAfter).toBe(playerBefore);
      expect(playerAfter).toBe(Player.CAT);
    });

    it('should return false for invalid cell index (negative)', () => {
      const result = service.makeMove(-1);
      expect(result).toBe(false);
    });

    it('should return false for invalid cell index (>8)', () => {
      const result = service.makeMove(9);
      expect(result).toBe(false);
    });

    it('should handle multiple valid moves in sequence', () => {
      service.makeMove(0); // UNICORN
      service.makeMove(1); // CAT
      service.makeMove(2); // UNICORN
      service.makeMove(3); // CAT
      
      const state = service.getCurrentState();
      expect(state.board[0]).toBe(Player.UNICORN);
      expect(state.board[1]).toBe(Player.CAT);
      expect(state.board[2]).toBe(Player.UNICORN);
      expect(state.board[3]).toBe(Player.CAT);
      expect(state.currentPlayer).toBe(Player.UNICORN);
    });

    it('should return false when game is over', () => {
      // This will be fully tested after win detection is implemented
      const currentState = service.getCurrentState();
      currentState.status = GameStatus.UNICORN_WINS;
      
      const result = service.makeMove(0);
      expect(result).toBe(false);
    });
  });

  describe('isCellEmpty()', () => {
    it('should return true for empty cell', () => {
      expect(service.isCellEmpty(0)).toBe(true);
    });

    it('should return false for occupied cell', () => {
      service.makeMove(0);
      expect(service.isCellEmpty(0)).toBe(false);
    });

    it('should return false for invalid index', () => {
      expect(service.isCellEmpty(-1)).toBe(false);
      expect(service.isCellEmpty(9)).toBe(false);
    });
  });

  describe('isValidMove()', () => {
    it('should return true for valid move', () => {
      expect(service.isValidMove(0)).toBe(true);
    });

    it('should return false for occupied cell', () => {
      service.makeMove(0);
      expect(service.isValidMove(0)).toBe(false);
    });

    it('should return false when game is over', () => {
      const currentState = service.getCurrentState();
      currentState.status = GameStatus.DRAW;
      
      expect(service.isValidMove(0)).toBe(false);
    });

    it('should return false for invalid index', () => {
      expect(service.isValidMove(-1)).toBe(false);
      expect(service.isValidMove(9)).toBe(false);
    });
  });
});

describe('GameService - Win/Draw Detection', () => {
  let service: GameService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GameService);
    service.initializeGame();
  });

  describe('checkWinner() - Rows', () => {
    it('should detect win in top row', () => {
      service.makeMove(0); // UNICORN
      service.makeMove(3); // CAT
      service.makeMove(1); // UNICORN
      service.makeMove(4); // CAT
      service.makeMove(2); // UNICORN - wins

      const state = service.getCurrentState();
      expect(state.status).toBe(GameStatus.UNICORN_WINS);
      expect(state.winningLine).toEqual([0, 1, 2]);
    });

    it('should detect win in middle row', () => {
      service.makeMove(3); // UNICORN
      service.makeMove(0); // CAT
      service.makeMove(4); // UNICORN
      service.makeMove(1); // CAT
      service.makeMove(5); // UNICORN - wins

      const state = service.getCurrentState();
      expect(state.status).toBe(GameStatus.UNICORN_WINS);
      expect(state.winningLine).toEqual([3, 4, 5]);
    });

    it('should detect win in bottom row', () => {
      service.makeMove(6); // UNICORN
      service.makeMove(0); // CAT
      service.makeMove(7); // UNICORN
      service.makeMove(1); // CAT
      service.makeMove(8); // UNICORN - wins

      const state = service.getCurrentState();
      expect(state.status).toBe(GameStatus.UNICORN_WINS);
      expect(state.winningLine).toEqual([6, 7, 8]);
    });
  });

  describe('checkWinner() - Columns', () => {
    it('should detect win in left column', () => {
      service.makeMove(0); // UNICORN
      service.makeMove(1); // CAT
      service.makeMove(3); // UNICORN
      service.makeMove(2); // CAT
      service.makeMove(6); // UNICORN - wins

      const state = service.getCurrentState();
      expect(state.status).toBe(GameStatus.UNICORN_WINS);
      expect(state.winningLine).toEqual([0, 3, 6]);
    });

    it('should detect win in middle column', () => {
      service.makeMove(1); // UNICORN
      service.makeMove(0); // CAT
      service.makeMove(4); // UNICORN
      service.makeMove(2); // CAT
      service.makeMove(7); // UNICORN - wins

      const state = service.getCurrentState();
      expect(state.status).toBe(GameStatus.UNICORN_WINS);
      expect(state.winningLine).toEqual([1, 4, 7]);
    });

    it('should detect win in right column', () => {
      service.makeMove(2); // UNICORN
      service.makeMove(0); // CAT
      service.makeMove(5); // UNICORN
      service.makeMove(1); // CAT
      service.makeMove(8); // UNICORN - wins

      const state = service.getCurrentState();
      expect(state.status).toBe(GameStatus.UNICORN_WINS);
      expect(state.winningLine).toEqual([2, 5, 8]);
    });
  });

  describe('checkWinner() - Diagonals', () => {
    it('should detect win in top-left to bottom-right diagonal', () => {
      service.makeMove(0); // UNICORN
      service.makeMove(1); // CAT
      service.makeMove(4); // UNICORN
      service.makeMove(2); // CAT
      service.makeMove(8); // UNICORN - wins

      const state = service.getCurrentState();
      expect(state.status).toBe(GameStatus.UNICORN_WINS);
      expect(state.winningLine).toEqual([0, 4, 8]);
    });

    it('should detect win in top-right to bottom-left diagonal', () => {
      service.makeMove(2); // UNICORN
      service.makeMove(0); // CAT
      service.makeMove(4); // UNICORN
      service.makeMove(1); // CAT
      service.makeMove(6); // UNICORN - wins

      const state = service.getCurrentState();
      expect(state.status).toBe(GameStatus.UNICORN_WINS);
      expect(state.winningLine).toEqual([2, 4, 6]);
    });
  });

  describe('checkWinner() - CAT wins', () => {
    it('should detect CAT win', () => {
      service.makeMove(0); // UNICORN
      service.makeMove(3); // CAT
      service.makeMove(1); // UNICORN
      service.makeMove(4); // CAT
      service.makeMove(6); // UNICORN
      service.makeMove(5); // CAT - wins

      const state = service.getCurrentState();
      expect(state.status).toBe(GameStatus.CAT_WINS);
      expect(state.winningLine).toEqual([3, 4, 5]);
    });
  });

  describe('checkDraw()', () => {
    it('should detect draw when board is full with no winner', () => {
      // Create a draw scenario
      // U U C
      // C C U
      // U C U
      service.makeMove(0); // UNICORN
      service.makeMove(2); // CAT
      service.makeMove(1); // UNICORN
      service.makeMove(3); // CAT
      service.makeMove(5); // UNICORN
      service.makeMove(4); // CAT
      service.makeMove(6); // UNICORN
      service.makeMove(7); // CAT
      service.makeMove(8); // UNICORN - draw
      
      const finalState = service.getCurrentState();
      expect(finalState.status).toBe(GameStatus.DRAW);
    });

    it('should not detect draw when board is not full', () => {
      service.makeMove(0); // UNICORN
      service.makeMove(1); // CAT
      
      const state = service.getCurrentState();
      expect(state.status).toBe(GameStatus.IN_PROGRESS);
    });
  });

  describe('Score Tracking', () => {
    it('should increment UNICORN score when UNICORN wins', () => {
      // UNICORN wins
      service.makeMove(0); // UNICORN
      service.makeMove(3); // CAT
      service.makeMove(1); // UNICORN
      service.makeMove(4); // CAT
      service.makeMove(2); // UNICORN - wins

      const state = service.getCurrentState();
      expect(state.scores.unicorn).toBe(1);
      expect(state.scores.cat).toBe(0);
    });

    it('should increment CAT score when CAT wins', () => {
      service.makeMove(0); // UNICORN
      service.makeMove(3); // CAT
      service.makeMove(1); // UNICORN
      service.makeMove(4); // CAT
      service.makeMove(6); // UNICORN
      service.makeMove(5); // CAT - wins

      const state = service.getCurrentState();
      expect(state.scores.unicorn).toBe(0);
      expect(state.scores.cat).toBe(1);
    });

    it('should not increment scores on draw', () => {
      // Create draw scenario
      // U U C
      // C C U
      // U C U
      service.makeMove(0); // UNICORN
      service.makeMove(2); // CAT
      service.makeMove(1); // UNICORN
      service.makeMove(3); // CAT
      service.makeMove(5); // UNICORN
      service.makeMove(4); // CAT
      service.makeMove(6); // UNICORN
      service.makeMove(7); // CAT
      service.makeMove(8); // UNICORN - draw
      
      const stateAfter = service.getCurrentState();
      expect(stateAfter.scores.unicorn).toBe(0);
      expect(stateAfter.scores.cat).toBe(0);
    });

    it('should accumulate scores across multiple games', () => {
      // Game 1: UNICORN wins
      service.makeMove(0);
      service.makeMove(3);
      service.makeMove(1);
      service.makeMove(4);
      service.makeMove(2);
      
      expect(service.getCurrentState().scores.unicorn).toBe(1);
      
      // Reset and play game 2: CAT wins
      service.resetGame();
      service.makeMove(0);
      service.makeMove(3);
      service.makeMove(1);
      service.makeMove(4);
      service.makeMove(6);
      service.makeMove(5);
      
      const finalState = service.getCurrentState();
      expect(finalState.scores.unicorn).toBe(1);
      expect(finalState.scores.cat).toBe(1);
    });
  });

  describe('Game Over State', () => {
    it('should prevent moves after game is won', () => {
      // UNICORN wins
      service.makeMove(0);
      service.makeMove(3);
      service.makeMove(1);
      service.makeMove(4);
      service.makeMove(2); // UNICORN wins
      
      // Try to make another move
      const result = service.makeMove(5);
      expect(result).toBe(false);
      
      const state = service.getCurrentState();
      expect(state.board[5]).toBeNull();
    });

    it('should prevent moves after draw', () => {
      // Create draw scenario
      // U U C
      // C C U
      // U C U
      service.makeMove(0); // UNICORN
      service.makeMove(2); // CAT
      service.makeMove(1); // UNICORN
      service.makeMove(3); // CAT
      service.makeMove(5); // UNICORN
      service.makeMove(4); // CAT
      service.makeMove(6); // UNICORN
      service.makeMove(7); // CAT
      service.makeMove(8); // UNICORN - draw
      
      // Try to make move after draw
      const result = service.makeMove(0);
      expect(result).toBe(false);
    });
  });
});
