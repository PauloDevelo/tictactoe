export type CellValue = 'X' | 'O' | null;
export type Board = CellValue[];
export type GameStatus = 'waiting' | 'playing' | 'finished';

export interface GameState {
  board: Board;
  currentTurn: 'X' | 'O';
  status: GameStatus;
  winner: 'X' | 'O' | 'draw' | null;
  winningLine: number[] | null;
  lastStartingPlayer?: 'X' | 'O'; // Track the last starting player for alternating
}

export const createInitialGameState = (): GameState => ({
  board: Array(9).fill(null),
  currentTurn: 'X',
  status: 'waiting',
  winner: null,
  winningLine: null,
  lastStartingPlayer: 'X',
});

export const makeMove = (
  state: GameState,
  position: number,
  symbol: 'X' | 'O'
): GameState => {
  if (state.board[position] !== null || state.status !== 'playing') {
    return state;
  }

  const newBoard = [...state.board];
  newBoard[position] = symbol;

  const winResult = checkWinner(newBoard);
  const isBoardFull = newBoard.every((cell) => cell !== null);

  return {
    ...state,
    board: newBoard,
    currentTurn: symbol === 'X' ? 'O' : 'X',
    status: winResult || isBoardFull ? 'finished' : 'playing',
    winner: winResult || (isBoardFull ? 'draw' : null),
    winningLine: winResult ? getWinningLine(newBoard) : null,
  };
};

export const startGame = (state: GameState): GameState => ({
  ...state,
  status: 'playing',
});

export const resetGame = (previousState?: GameState): GameState => {
  // Alternate the starting player based on the previous game
  const nextStartingPlayer = previousState?.lastStartingPlayer === 'X' ? 'O' : 'X';
  
  return {
    board: Array(9).fill(null),
    currentTurn: nextStartingPlayer,
    status: 'waiting',
    winner: null,
    winningLine: null,
    lastStartingPlayer: nextStartingPlayer,
  };
};

const WINNING_COMBINATIONS = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

const checkWinner = (board: Board): 'X' | 'O' | null => {
  for (const combination of WINNING_COMBINATIONS) {
    const [a, b, c] = combination;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a] as 'X' | 'O';
    }
  }
  return null;
};

const getWinningLine = (board: Board): number[] | null => {
  for (const combination of WINNING_COMBINATIONS) {
    const [a, b, c] = combination;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return combination;
    }
  }
  return null;
};
