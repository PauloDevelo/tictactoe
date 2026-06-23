import { CellValue, GameState } from './GameState';

export const COLUMNS = 7;
export const ROWS = 6;
export const CONNECT_LENGTH = 4;
export const TOTAL_CELLS = COLUMNS * ROWS;

/**
 * Converts a column index (0-6) to the target cell index on the flat board.
 * The piece falls to the lowest empty row in that column.
 * @param board - Current board state (flat array of 42 cells)
 * @param column - Column index (0-6)
 * @returns The cell index where the piece should land, or -1 if column is full
 */
export function getDropPosition(board: CellValue[], column: number): number {
  if (column < 0 || column >= COLUMNS) {
    return -1;
  }

  // Start from the bottom row and go up
  for (let row = ROWS - 1; row >= 0; row--) {
    const cellIndex = row * COLUMNS + column;
    if (board[cellIndex] === null) {
      return cellIndex;
    }
  }

  // Column is full
  return -1;
}

export function checkWinnerC4(board: CellValue[]): 'X' | 'O' | null {
  // Check horizontal
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col <= COLUMNS - CONNECT_LENGTH; col++) {
      const start = row * COLUMNS + col;
      if (
        board[start] !== null &&
        board[start] === board[start + 1] &&
        board[start] === board[start + 2] &&
        board[start] === board[start + 3]
      ) {
        return board[start] as 'X' | 'O';
      }
    }
  }

  // Check vertical
  for (let row = 0; row <= ROWS - CONNECT_LENGTH; row++) {
    for (let col = 0; col < COLUMNS; col++) {
      const start = row * COLUMNS + col;
      const step = COLUMNS;
      if (
        board[start] !== null &&
        board[start] === board[start + step] &&
        board[start] === board[start + step * 2] &&
        board[start] === board[start + step * 3]
      ) {
        return board[start] as 'X' | 'O';
      }
    }
  }

  // Check diagonal (top-left to bottom-right)
  for (let row = 0; row <= ROWS - CONNECT_LENGTH; row++) {
    for (let col = 0; col <= COLUMNS - CONNECT_LENGTH; col++) {
      const start = row * COLUMNS + col;
      const step = COLUMNS + 1;
      if (
        board[start] !== null &&
        board[start] === board[start + step] &&
        board[start] === board[start + step * 2] &&
        board[start] === board[start + step * 3]
      ) {
        return board[start] as 'X' | 'O';
      }
    }
  }

  // Check anti-diagonal (top-right to bottom-left)
  for (let row = 0; row <= ROWS - CONNECT_LENGTH; row++) {
    for (let col = CONNECT_LENGTH - 1; col < COLUMNS; col++) {
      const start = row * COLUMNS + col;
      const step = COLUMNS - 1;
      if (
        board[start] !== null &&
        board[start] === board[start + step] &&
        board[start] === board[start + step * 2] &&
        board[start] === board[start + step * 3]
      ) {
        return board[start] as 'X' | 'O';
      }
    }
  }

  return null;
}

export function getWinningLineC4(board: CellValue[]): number[] | null {
  const winner = checkWinnerC4(board);
  if (winner === null) {
    return null;
  }

  // Check horizontal
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col <= COLUMNS - CONNECT_LENGTH; col++) {
      const start = row * COLUMNS + col;
      if (
        board[start] === winner &&
        board[start + 1] === winner &&
        board[start + 2] === winner &&
        board[start + 3] === winner
      ) {
        return [start, start + 1, start + 2, start + 3];
      }
    }
  }

  // Check vertical
  for (let row = 0; row <= ROWS - CONNECT_LENGTH; row++) {
    for (let col = 0; col < COLUMNS; col++) {
      const start = row * COLUMNS + col;
      const step = COLUMNS;
      if (
        board[start] === winner &&
        board[start + step] === winner &&
        board[start + step * 2] === winner &&
        board[start + step * 3] === winner
      ) {
        return [start, start + step, start + step * 2, start + step * 3];
      }
    }
  }

  // Check diagonal (top-left to bottom-right)
  for (let row = 0; row <= ROWS - CONNECT_LENGTH; row++) {
    for (let col = 0; col <= COLUMNS - CONNECT_LENGTH; col++) {
      const start = row * COLUMNS + col;
      const step = COLUMNS + 1;
      if (
        board[start] === winner &&
        board[start + step] === winner &&
        board[start + step * 2] === winner &&
        board[start + step * 3] === winner
      ) {
        return [start, start + step, start + step * 2, start + step * 3];
      }
    }
  }

  // Check anti-diagonal (top-right to bottom-left)
  for (let row = 0; row <= ROWS - CONNECT_LENGTH; row++) {
    for (let col = CONNECT_LENGTH - 1; col < COLUMNS; col++) {
      const start = row * COLUMNS + col;
      const step = COLUMNS - 1;
      if (
        board[start] === winner &&
        board[start + step] === winner &&
        board[start + step * 2] === winner &&
        board[start + step * 3] === winner
      ) {
        return [start, start + step, start + step * 2, start + step * 3];
      }
    }
  }

  return null;
}

export function isBoardFullC4(board: CellValue[]): boolean {
  return board.every((cell) => cell !== null);
}

export function createInitialGameStateC4(): GameState {
  return {
    board: Array(TOTAL_CELLS).fill(null),
    currentTurn: 'X',
    status: 'waiting',
    winner: null,
    winningLine: null,
    lastStartingPlayer: 'X',
  };
}

export function makeMoveC4(state: GameState, column: number, symbol: 'X' | 'O'): GameState {
  // Validate column
  if (column < 0 || column >= COLUMNS) {
    return state;
  }

  // Find drop position (gravity)
  const dropPos = getDropPosition(state.board, column);
  if (dropPos === -1) {
    return state; // Column is full
  }

  // Check if game is already finished
  if (state.status !== 'playing') {
    return state;
  }

  // Place the piece
  const newBoard = [...state.board];
  newBoard[dropPos] = symbol;

  // Check for winner
  const winResult = checkWinnerC4(newBoard);
  const isBoardFull = isBoardFullC4(newBoard);

  return {
    ...state,
    board: newBoard,
    currentTurn: symbol === 'X' ? 'O' : 'X',
    status: winResult || isBoardFull ? 'finished' : 'playing',
    winner: winResult || (isBoardFull ? 'draw' : null),
    winningLine: winResult ? getWinningLineC4(newBoard) : null,
  };
}

export function isColumnFullC4(board: CellValue[], column: number): boolean {
  if (column < 0 || column >= COLUMNS) {
    return true;
  }
  return board[column] !== null; // Top cell of column is filled = column is full
}

export function resetGameC4(previousState?: GameState): GameState {
  // Alternate the starting player based on the previous game
  const nextStartingPlayer = previousState?.lastStartingPlayer === 'X' ? 'O' : 'X';

  return {
    board: Array(TOTAL_CELLS).fill(null),
    currentTurn: nextStartingPlayer,
    status: 'waiting',
    winner: null,
    winningLine: null,
    lastStartingPlayer: nextStartingPlayer,
  };
}
