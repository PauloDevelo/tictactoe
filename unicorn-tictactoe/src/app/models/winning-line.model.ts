export type WinningLine = [number, number, number];
export type Connect4WinningLine = [number, number, number, number];

export const WINNING_COMBINATIONS: WinningLine[] = [
  // Rows
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  // Columns
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  // Diagonals
  [0, 4, 8],
  [2, 4, 6]
];

/**
 * Connect 4 constants for board dimensions and win length.
 */
export const C4_COLUMNS = 7;
export const C4_ROWS = 6;
export const C4_CONNECT_LENGTH = 4;
export const C4_TOTAL_CELLS = C4_COLUMNS * C4_ROWS;

/**
 * Connect 4 winning combinations are computed dynamically at runtime
 * since there are many possible 4-in-a-row positions (horizontal, vertical,
 * diagonal, anti-diagonal). The GameService generates them via
 * checkConnect4Winner() and getConnect4WinningLine().
 */
