import {
  createInitialGameStateC4,
  getDropPosition,
  makeMoveC4,
  checkWinnerC4,
  getWinningLineC4,
  isBoardFullC4,
  isColumnFullC4,
  COLUMNS,
  ROWS,
  TOTAL_CELLS,
} from '../models/Connect4GameState';
import { CellValue } from '../models/GameState';

// Board layout: row 0 is TOP, row 5 is BOTTOM
// Row r, column c → index = r * COLUMNS + c

describe('Connect4GameState', () => {
  describe('Board initialization (createInitialGameStateC4)', () => {
    it('returns a 42-cell board', () => {
      const state = createInitialGameStateC4();
      expect(state.board).toHaveLength(TOTAL_CELLS);
    });

    it('returns a board with all cells null', () => {
      const state = createInitialGameStateC4();
      expect(state.board.every((cell) => cell === null)).toBe(true);
    });

    it('sets currentTurn to X', () => {
      const state = createInitialGameStateC4();
      expect(state.currentTurn).toBe('X');
    });

    it('sets status to waiting', () => {
      const state = createInitialGameStateC4();
      expect(state.status).toBe('waiting');
    });

    it('sets winner and winningLine to null', () => {
      const state = createInitialGameStateC4();
      expect(state.winner).toBeNull();
      expect(state.winningLine).toBeNull();
    });

    it('sets lastStartingPlayer to X', () => {
      const state = createInitialGameStateC4();
      expect(state.lastStartingPlayer).toBe('X');
    });
  });

  describe('Gravity (getDropPosition)', () => {
    it('empty board: dropping in column 0 returns bottom cell (row 5, index 35)', () => {
      const board = Array(TOTAL_CELLS).fill(null);
      const pos = getDropPosition(board, 0);
      expect(pos).toBe(5 * COLUMNS + 0);
    });

    it('empty board: dropping in any column returns the bottom cell', () => {
      const board = Array(TOTAL_CELLS).fill(null);
      for (let col = 0; col < COLUMNS; col++) {
        expect(getDropPosition(board, col)).toBe(5 * COLUMNS + col);
      }
    });

    it('column partially filled: returns correct lowest empty cell', () => {
      const board = Array(TOTAL_CELLS).fill(null);
      // Fill column 0 from bottom: row 5 and row 4
      board[5 * COLUMNS + 0] = 'X';
      board[4 * COLUMNS + 0] = 'O';
      const pos = getDropPosition(board, 0);
      expect(pos).toBe(3 * COLUMNS + 0);
    });

    it('column with pieces in other columns: gravity works independently', () => {
      const board = Array(TOTAL_CELLS).fill(null);
      board[5 * COLUMNS + 0] = 'X';
      board[5 * COLUMNS + 1] = 'O';
      expect(getDropPosition(board, 2)).toBe(5 * COLUMNS + 2);
    });

    it('full column: returns -1', () => {
      const board = Array(TOTAL_CELLS).fill(null);
      for (let row = 0; row < ROWS; row++) {
        board[row * COLUMNS + 0] = 'X';
      }
      expect(getDropPosition(board, 0)).toBe(-1);
    });

    it('invalid column (negative): returns -1', () => {
      const board = Array(TOTAL_CELLS).fill(null);
      expect(getDropPosition(board, -1)).toBe(-1);
    });

    it('invalid column (out of range): returns -1', () => {
      const board = Array(TOTAL_CELLS).fill(null);
      expect(getDropPosition(board, 7)).toBe(-1);
    });

    it('invalid column (very large): returns -1', () => {
      const board = Array(TOTAL_CELLS).fill(null);
      expect(getDropPosition(board, 100)).toBe(-1);
    });
  });

  describe('Make move (makeMoveC4)', () => {
    let playingState: ReturnType<typeof createInitialGameStateC4>;

    beforeEach(() => {
      playingState = createInitialGameStateC4();
      playingState.status = 'playing';
    });

    it('valid move places piece at correct position with gravity', () => {
      let state = makeMoveC4(playingState, 0, 'X');
      expect(state.board[5 * COLUMNS + 0]).toBe('X');

      state = makeMoveC4(state, 0, 'O');
      expect(state.board[4 * COLUMNS + 0]).toBe('O');
    });

    it('invalid move (full column) returns unchanged state', () => {
      let state = playingState;
      for (let i = 0; i < ROWS; i++) {
        const symbol = i % 2 === 0 ? 'X' : 'O';
        state = makeMoveC4(state, 0, symbol);
      }
      const boardBefore = [...state.board];
      const stateAfter = makeMoveC4(state, 0, 'X');
      expect(stateAfter.board).toEqual(boardBefore);
    });

    it('invalid column returns unchanged state', () => {
      const boardBefore = [...playingState.board];
      const stateAfter = makeMoveC4(playingState, -1, 'X');
      expect(stateAfter.board).toEqual(boardBefore);
    });

    it('move on non-playing game returns unchanged state', () => {
      const waitingState = createInitialGameStateC4();
      const result = makeMoveC4(waitingState, 0, 'X');
      expect(result.board[5 * COLUMNS + 0]).toBeNull();
    });

    it('turn alternates between X and O', () => {
      let state = makeMoveC4(playingState, 0, 'X');
      expect(state.currentTurn).toBe('O');
      state = makeMoveC4(state, 1, 'O');
      expect(state.currentTurn).toBe('X');
      state = makeMoveC4(state, 2, 'X');
      expect(state.currentTurn).toBe('O');
    });

    it('game ends when 4 in a row (horizontal)', () => {
      let state = playingState;
      state = makeMoveC4(state, 0, 'X');
      state = makeMoveC4(state, 5, 'O');
      state = makeMoveC4(state, 1, 'X');
      state = makeMoveC4(state, 6, 'O');
      state = makeMoveC4(state, 2, 'X');
      state = makeMoveC4(state, 4, 'O');
      const winState = makeMoveC4(state, 3, 'X');

      expect(winState.status).toBe('finished');
      expect(winState.winner).toBe('X');
      expect(winState.winningLine).not.toBeNull();
    });

    it('game ends when 4 stacked (vertical)', () => {
      let state = playingState;
      state = makeMoveC4(state, 0, 'X');
      state = makeMoveC4(state, 3, 'O');
      state = makeMoveC4(state, 0, 'X');
      state = makeMoveC4(state, 4, 'O');
      state = makeMoveC4(state, 0, 'X');
      state = makeMoveC4(state, 5, 'O');
      const winState = makeMoveC4(state, 0, 'X');

      expect(winState.status).toBe('finished');
      expect(winState.winner).toBe('X');
      expect(winState.winningLine).not.toBeNull();
    });

    it('game ends when board is full (draw)', () => {
      // Board with 41 of 42 cells filled, no winner.
      // Columns use alternating XXO OXX pattern (bottom to top) which prevents
      // any 4-in-a-row. Last cell (row 5, col 6) is empty.
      // After placing the final piece, the game should end in a draw.
      const board: CellValue[] = [
        // row 0 (top)
        'X', 'O', 'X', 'O', 'X', 'O', 'X',
        // row 1
        'X', 'O', 'X', 'O', 'X', 'O', 'X',
        // row 2
        'O', 'X', 'O', 'X', 'O', 'X', 'O',
        // row 3
        'O', 'X', 'O', 'X', 'O', 'X', 'O',
        // row 4
        'X', 'O', 'X', 'O', 'X', 'O', 'X',
        // row 5 (bottom) — last cell empty
        'X', 'O', 'X', 'O', 'X', 'O', null,
      ];
      expect(checkWinnerC4(board)).toBeNull();
      expect(isBoardFullC4(board)).toBe(false);

      const drawState = { ...playingState, board };
      // Make the last move in column 6 (fills the final cell at position 41)
      const result = makeMoveC4(drawState, 6, 'X');
      expect(result.status).toBe('finished');
      expect(result.winner).toBe('draw');
    });

    it('returns unchanged state for move after game finished', () => {
      let state = playingState;
      state = makeMoveC4(state, 0, 'X');
      state = makeMoveC4(state, 5, 'O');
      state = makeMoveC4(state, 1, 'X');
      state = makeMoveC4(state, 6, 'O');
      state = makeMoveC4(state, 2, 'X');
      state = makeMoveC4(state, 4, 'O');
      state = makeMoveC4(state, 3, 'X');

      const boardBefore = [...state.board];
      const stateAfter = makeMoveC4(state, 4, 'O');
      expect(stateAfter.board).toEqual(boardBefore);
    });
  });

  describe('Win detection (checkWinnerC4)', () => {
    it('detects horizontal win (4 in a row)', () => {
      const board = Array(TOTAL_CELLS).fill(null);
      board[5 * COLUMNS + 0] = 'X';
      board[5 * COLUMNS + 1] = 'X';
      board[5 * COLUMNS + 2] = 'X';
      board[5 * COLUMNS + 3] = 'X';
      expect(checkWinnerC4(board)).toBe('X');
    });

    it('detects horizontal win on a middle row', () => {
      const board = Array(TOTAL_CELLS).fill(null);
      board[2 * COLUMNS + 0] = 'O';
      board[2 * COLUMNS + 1] = 'O';
      board[2 * COLUMNS + 2] = 'O';
      board[2 * COLUMNS + 3] = 'O';
      expect(checkWinnerC4(board)).toBe('O');
    });

    it('detects vertical win (4 stacked)', () => {
      const board = Array(TOTAL_CELLS).fill(null);
      board[2 * COLUMNS + 0] = 'X';
      board[3 * COLUMNS + 0] = 'X';
      board[4 * COLUMNS + 0] = 'X';
      board[5 * COLUMNS + 0] = 'X';
      expect(checkWinnerC4(board)).toBe('X');
    });

    it('detects diagonal win (top-left to bottom-right)', () => {
      const board = Array(TOTAL_CELLS).fill(null);
      board[2 * COLUMNS + 0] = 'X';
      board[3 * COLUMNS + 1] = 'X';
      board[4 * COLUMNS + 2] = 'X';
      board[5 * COLUMNS + 3] = 'X';
      expect(checkWinnerC4(board)).toBe('X');
    });

    it('detects anti-diagonal win (top-right to bottom-left)', () => {
      const board = Array(TOTAL_CELLS).fill(null);
      board[2 * COLUMNS + 6] = 'X';
      board[3 * COLUMNS + 5] = 'X';
      board[4 * COLUMNS + 4] = 'X';
      board[5 * COLUMNS + 3] = 'X';
      expect(checkWinnerC4(board)).toBe('X');
    });

    it('returns null with only 3 in a row', () => {
      const board = Array(TOTAL_CELLS).fill(null);
      board[5 * COLUMNS + 0] = 'X';
      board[5 * COLUMNS + 1] = 'X';
      board[5 * COLUMNS + 2] = 'X';
      expect(checkWinnerC4(board)).toBeNull();
    });

    it('returns null with disconnected pieces', () => {
      const board = Array(TOTAL_CELLS).fill(null);
      board[5 * COLUMNS + 0] = 'X';
      board[5 * COLUMNS + 3] = 'X';
      board[4 * COLUMNS + 3] = 'X';
      board[3 * COLUMNS + 0] = 'X';
      expect(checkWinnerC4(board)).toBeNull();
    });

    it('returns null for empty board', () => {
      const board = Array(TOTAL_CELLS).fill(null);
      expect(checkWinnerC4(board)).toBeNull();
    });

    it('detects winner with 5 in a row', () => {
      const board = Array(TOTAL_CELLS).fill(null);
      board[5 * COLUMNS + 0] = 'X';
      board[5 * COLUMNS + 1] = 'X';
      board[5 * COLUMNS + 2] = 'X';
      board[5 * COLUMNS + 3] = 'X';
      board[5 * COLUMNS + 4] = 'X';
      expect(checkWinnerC4(board)).toBe('X');
    });

    it('detects win for O as well', () => {
      const board = Array(TOTAL_CELLS).fill(null);
      board[5 * COLUMNS + 0] = 'O';
      board[5 * COLUMNS + 1] = 'O';
      board[5 * COLUMNS + 2] = 'O';
      board[5 * COLUMNS + 3] = 'O';
      expect(checkWinnerC4(board)).toBe('O');
    });

    it('does not count different pieces together', () => {
      const board = Array(TOTAL_CELLS).fill(null);
      board[5 * COLUMNS + 0] = 'X';
      board[5 * COLUMNS + 1] = 'X';
      board[5 * COLUMNS + 2] = 'O';
      board[5 * COLUMNS + 3] = 'X';
      expect(checkWinnerC4(board)).toBeNull();
    });
  });

  describe('Winning line (getWinningLineC4)', () => {
    it('returns exactly 4 indices for a horizontal winning line', () => {
      const board = Array(TOTAL_CELLS).fill(null);
      board[5 * COLUMNS + 0] = 'X';
      board[5 * COLUMNS + 1] = 'X';
      board[5 * COLUMNS + 2] = 'X';
      board[5 * COLUMNS + 3] = 'X';
      const line = getWinningLineC4(board);
      expect(line).not.toBeNull();
      expect(line).toHaveLength(4);
      expect(line).toEqual([35, 36, 37, 38]);
    });

    it('returns exactly 4 indices for a vertical winning line', () => {
      const board = Array(TOTAL_CELLS).fill(null);
      board[2 * COLUMNS + 0] = 'X';
      board[3 * COLUMNS + 0] = 'X';
      board[4 * COLUMNS + 0] = 'X';
      board[5 * COLUMNS + 0] = 'X';
      const line = getWinningLineC4(board);
      expect(line).not.toBeNull();
      expect(line).toHaveLength(4);
      expect(line).toEqual([14, 21, 28, 35]);
    });

    it('returns exactly 4 indices for a diagonal winning line', () => {
      const board = Array(TOTAL_CELLS).fill(null);
      board[2 * COLUMNS + 0] = 'X';
      board[3 * COLUMNS + 1] = 'X';
      board[4 * COLUMNS + 2] = 'X';
      board[5 * COLUMNS + 3] = 'X';
      const line = getWinningLineC4(board);
      expect(line).not.toBeNull();
      expect(line).toHaveLength(4);
      expect(line).toEqual([14, 22, 30, 38]);
    });

    it('returns exactly 4 indices for an anti-diagonal winning line', () => {
      const board = Array(TOTAL_CELLS).fill(null);
      board[2 * COLUMNS + 6] = 'X';
      board[3 * COLUMNS + 5] = 'X';
      board[4 * COLUMNS + 4] = 'X';
      board[5 * COLUMNS + 3] = 'X';
      const line = getWinningLineC4(board);
      expect(line).not.toBeNull();
      expect(line).toHaveLength(4);
      expect(line).toEqual([20, 26, 32, 38]);
    });

    it('returns null when no winner', () => {
      const board = Array(TOTAL_CELLS).fill(null);
      board[5 * COLUMNS + 0] = 'X';
      board[5 * COLUMNS + 1] = 'X';
      board[5 * COLUMNS + 2] = 'X';
      expect(getWinningLineC4(board)).toBeNull();
    });

    it('returns null for empty board', () => {
      const board = Array(TOTAL_CELLS).fill(null);
      expect(getWinningLineC4(board)).toBeNull();
    });

    it('winning line indices correspond to the winning player', () => {
      const board = Array(TOTAL_CELLS).fill(null);
      board[5 * COLUMNS + 0] = 'O';
      board[5 * COLUMNS + 1] = 'O';
      board[5 * COLUMNS + 2] = 'O';
      board[5 * COLUMNS + 3] = 'O';
      const line = getWinningLineC4(board);
      expect(line).not.toBeNull();
      line!.forEach((idx) => {
        expect(board[idx]).toBe('O');
      });
    });
  });

  describe('isBoardFullC4', () => {
    it('returns false for empty board', () => {
      const board = Array(TOTAL_CELLS).fill(null);
      expect(isBoardFullC4(board)).toBe(false);
    });

    it('returns true when all cells are filled', () => {
      const board = Array(TOTAL_CELLS).fill('X');
      expect(isBoardFullC4(board)).toBe(true);
    });

    it('returns false with one empty cell', () => {
      const board = Array(TOTAL_CELLS).fill('X');
      board[0] = null;
      expect(isBoardFullC4(board)).toBe(false);
    });
  });

  describe('isColumnFullC4', () => {
    it('returns true for full column', () => {
      const board = Array(TOTAL_CELLS).fill(null);
      for (let row = 0; row < ROWS; row++) {
        board[row * COLUMNS + 0] = 'X';
      }
      expect(isColumnFullC4(board, 0)).toBe(true);
    });

    it('returns false for empty column', () => {
      const board = Array(TOTAL_CELLS).fill(null);
      expect(isColumnFullC4(board, 0)).toBe(false);
    });

    it('returns true for invalid column', () => {
      const board = Array(TOTAL_CELLS).fill(null);
      expect(isColumnFullC4(board, -1)).toBe(true);
      expect(isColumnFullC4(board, 7)).toBe(true);
    });
  });
});
