import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { GameState } from '../models/game-state.model';
import { Player } from '../models/player.model';
import { GameStatus } from '../models/game-status.enum';
import { Cell } from '../models/cell.model';
import { WINNING_COMBINATIONS } from '../models/winning-line.model';
import { GameType } from '../models/game-type.model';

const C4_COLUMNS = 7;
const C4_ROWS = 6;
const C4_TOTAL_CELLS = C4_COLUMNS * C4_ROWS;
const C4_CONNECT_LENGTH = 4;

@Injectable({
  providedIn: 'root'
})
export class GameService {
  private lastStartingPlayer: Player = Player.CAT; // Track last starting player (starts as CAT so first game starts with UNICORN)
  private gameTypeSubject = new BehaviorSubject<GameType>('tictactoe'); // Default to tictactoe for backward compatibility
  public gameType$ = this.gameTypeSubject.asObservable();

  private initialState: GameState = {
    board: Array(9).fill(null) as Cell[],
    currentPlayer: Player.UNICORN,
    status: GameStatus.IN_PROGRESS,
    scores: {
      unicorn: 0,
      cat: 0
    },
    winningLine: null
  };

  private gameStateSubject = new BehaviorSubject<GameState>(this.initialState);
  public gameState$: Observable<GameState> = this.gameStateSubject.asObservable();

  constructor() {
    // Initialize with default state
    this.gameStateSubject.next({ ...this.initialState });
  }

  /**
   * Set the game type (tictactoe or connect4)
   * @param type - The game type to set
   */
  setGameType(type: GameType): void {
    this.gameTypeSubject.next(type);
  }

  /**
   * Get the current game type
   * @returns The current game type
   */
  getGameType(): GameType {
    return this.gameTypeSubject.value;
  }

  /**
   * Initialize a completely new game (resets scores)
   */
  initializeGame(): void {
    // Alternate the starting player
    this.lastStartingPlayer = this.getNextPlayer(this.lastStartingPlayer);

    const gameType = this.gameTypeSubject.value;
    const boardSize = gameType === 'connect4' ? C4_TOTAL_CELLS : 9;

    this.initialState = {
      board: Array(boardSize).fill(null) as Cell[],
      currentPlayer: this.lastStartingPlayer,
      status: GameStatus.IN_PROGRESS,
      scores: {
        unicorn: 0,
        cat: 0
      },
      winningLine: null
    };
    this.gameStateSubject.next({ ...this.initialState });
  }

  /**
   * Reset current game (preserves scores)
   */
  resetGame(): void {
    const currentState = this.gameStateSubject.value;

    // Alternate the starting player
    this.lastStartingPlayer = this.getNextPlayer(this.lastStartingPlayer);

    const gameType = this.gameTypeSubject.value;
    const boardSize = gameType === 'connect4' ? C4_TOTAL_CELLS : 9;

    const newState: GameState = {
      board: Array(boardSize).fill(null) as Cell[],
      currentPlayer: this.lastStartingPlayer,
      status: GameStatus.IN_PROGRESS,
      scores: {
        unicorn: currentState.scores.unicorn,
        cat: currentState.scores.cat
      },
      winningLine: null
    };
    this.gameStateSubject.next(newState);
  }

  /**
   * Get current game state value (non-observable)
   */
  getCurrentState(): GameState {
    return this.gameStateSubject.value;
  }

  /**
   * Make a move at the specified position.
   * For Tic-Tac-Toe: cellIndex is a direct board index (0-8).
   * For Connect 4: cellIndex is a column index (0-6), piece drops by gravity.
   * @param cellIndex - Index of the cell or column
   * @returns true if move was successful, false otherwise
   */
  makeMove(cellIndex: number): boolean {
    const gameType = this.gameTypeSubject.value;

    if (gameType === 'connect4') {
      return this.makeConnect4Move(cellIndex);
    }

    // Tic-Tac-Toe logic
    if (!this.isValidMove(cellIndex)) {
      return false;
    }

    const currentState = this.gameStateSubject.value;
    const newBoard = [...currentState.board];
    newBoard[cellIndex] = currentState.currentPlayer;

    let newState: GameState = {
      ...currentState,
      board: newBoard
    };

    // Check for winner
    const winner = this.checkWinner(newBoard);
    if (winner) {
      newState.status = winner === Player.UNICORN
        ? GameStatus.UNICORN_WINS
        : GameStatus.CAT_WINS;
      newState.winningLine = this.getWinningLine(newBoard, winner);
      newState.scores = {
        ...currentState.scores,
        [winner]: currentState.scores[winner] + 1
      };
    }
    // Check for draw
    else if (this.checkDraw(newBoard)) {
      newState.status = GameStatus.DRAW;
    }
    // Game continues
    else {
      newState.currentPlayer = this.getNextPlayer(currentState.currentPlayer);
    }

    this.gameStateSubject.next(newState);
    return true;
  }

  /**
   * Make a Connect 4 move (column-based with gravity)
   */
  private makeConnect4Move(column: number): boolean {
    const currentState = this.gameStateSubject.value;

    // Check if game is in progress
    if (currentState.status !== GameStatus.IN_PROGRESS) {
      return false;
    }

    // Validate column
    if (column < 0 || column >= C4_COLUMNS) {
      return false;
    }

    // Find drop position (gravity - lowest empty row in column)
    const dropPos = this.getC4DropPosition(currentState.board, column);
    if (dropPos === -1) {
      return false; // Column is full
    }

    const newBoard = [...currentState.board];
    newBoard[dropPos] = currentState.currentPlayer;

    let newState: GameState = {
      ...currentState,
      board: newBoard
    };

    // Check for winner
    const winner = this.checkConnect4Winner(newBoard);
    if (winner) {
      newState.status = winner === Player.UNICORN
        ? GameStatus.UNICORN_WINS
        : GameStatus.CAT_WINS;
      newState.winningLine = this.getConnect4WinningLine(newBoard, winner);
      newState.scores = {
        ...currentState.scores,
        [winner]: currentState.scores[winner] + 1
      };
    }
    // Check for draw
    else if (this.checkConnect4Draw(newBoard)) {
      newState.status = GameStatus.DRAW;
    }
    // Game continues
    else {
      newState.currentPlayer = this.getNextPlayer(currentState.currentPlayer);
    }

    this.gameStateSubject.next(newState);
    return true;
  }

  /**
   * Get the drop position for Connect 4 (gravity)
   * Returns the index of the lowest empty cell in the given column, or -1 if full.
   */
  private getC4DropPosition(board: Cell[], column: number): number {
    if (column < 0 || column >= C4_COLUMNS) {
      return -1;
    }
    for (let row = C4_ROWS - 1; row >= 0; row--) {
      const cellIndex = row * C4_COLUMNS + column;
      if (board[cellIndex] === null) {
        return cellIndex;
      }
    }
    return -1; // Column is full
  }

  /**
   * Check if a move is valid
   * @param cellIndex - Index of the cell (0-8 for TTT, 0-6 column for C4)
   * @returns true if move is valid, false otherwise
   */
  isValidMove(cellIndex: number): boolean {
    const currentState = this.gameStateSubject.value;

    // Check if game is over
    if (currentState.status !== GameStatus.IN_PROGRESS) {
      return false;
    }

    const gameType = this.gameTypeSubject.value;

    if (gameType === 'connect4') {
      // For Connect 4, validate column
      if (cellIndex < 0 || cellIndex >= C4_COLUMNS) {
        return false;
      }
      // Check if column is not full (top cell is empty)
      return currentState.board[cellIndex] === null;
    }

    // Tic-Tac-Toe validation
    if (cellIndex < 0 || cellIndex > 8) {
      return false;
    }

    // Check if cell is empty
    return this.isCellEmpty(cellIndex);
  }

  /**
   * Check if a cell is empty
   * @param cellIndex - Index of the cell (0-8 for TTT)
   * @returns true if cell is empty, false otherwise
   */
  isCellEmpty(cellIndex: number): boolean {
    if (cellIndex < 0 || cellIndex > 8) {
      return false;
    }

    const currentState = this.gameStateSubject.value;
    return currentState.board[cellIndex] === null;
  }

  /**
   * Get the next player
   * @param currentPlayer - Current player
   * @returns Next player
   */
  private getNextPlayer(currentPlayer: Player): Player {
    return currentPlayer === Player.UNICORN ? Player.CAT : Player.UNICORN;
  }

  /**
   * Check if there is a winner (Tic-Tac-Toe: 3-in-a-row)
   * @param board - Current board state
   * @returns Winning player or null
   */
  private checkWinner(board: Cell[]): Player | null {
    for (const combination of WINNING_COMBINATIONS) {
      const [a, b, c] = combination;
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return board[a];
      }
    }
    return null;
  }

  /**
   * Get the winning line combination (Tic-Tac-Toe)
   * @param board - Current board state
   * @param winner - Winning player
   * @returns Winning line indices or null
   */
  private getWinningLine(board: Cell[], winner: Player): number[] | null {
    for (const combination of WINNING_COMBINATIONS) {
      const [a, b, c] = combination;
      if (board[a] === winner && board[b] === winner && board[c] === winner) {
        return combination;
      }
    }
    return null;
  }

  /**
   * Check if the game is a draw (Tic-Tac-Toe)
   * @param board - Current board state
   * @returns true if draw, false otherwise
   */
  private checkDraw(board: Cell[]): boolean {
    return board.every(cell => cell !== null) && !this.checkWinner(board);
  }

  /**
   * Check if there is a Connect 4 winner (4-in-a-row)
   */
  private checkConnect4Winner(board: Cell[]): Player | null {
    // Check horizontal
    for (let row = 0; row < C4_ROWS; row++) {
      for (let col = 0; col <= C4_COLUMNS - C4_CONNECT_LENGTH; col++) {
        const start = row * C4_COLUMNS + col;
        if (
          board[start] !== null &&
          board[start] === board[start + 1] &&
          board[start] === board[start + 2] &&
          board[start] === board[start + 3]
        ) {
          return board[start];
        }
      }
    }

    // Check vertical
    for (let row = 0; row <= C4_ROWS - C4_CONNECT_LENGTH; row++) {
      for (let col = 0; col < C4_COLUMNS; col++) {
        const start = row * C4_COLUMNS + col;
        const step = C4_COLUMNS;
        if (
          board[start] !== null &&
          board[start] === board[start + step] &&
          board[start] === board[start + step * 2] &&
          board[start] === board[start + step * 3]
        ) {
          return board[start];
        }
      }
    }

    // Check diagonal (top-left to bottom-right)
    for (let row = 0; row <= C4_ROWS - C4_CONNECT_LENGTH; row++) {
      for (let col = 0; col <= C4_COLUMNS - C4_CONNECT_LENGTH; col++) {
        const start = row * C4_COLUMNS + col;
        const step = C4_COLUMNS + 1;
        if (
          board[start] !== null &&
          board[start] === board[start + step] &&
          board[start] === board[start + step * 2] &&
          board[start] === board[start + step * 3]
        ) {
          return board[start];
        }
      }
    }

    // Check anti-diagonal (top-right to bottom-left)
    for (let row = 0; row <= C4_ROWS - C4_CONNECT_LENGTH; row++) {
      for (let col = C4_CONNECT_LENGTH - 1; col < C4_COLUMNS; col++) {
        const start = row * C4_COLUMNS + col;
        const step = C4_COLUMNS - 1;
        if (
          board[start] !== null &&
          board[start] === board[start + step] &&
          board[start] === board[start + step * 2] &&
          board[start] === board[start + step * 3]
        ) {
          return board[start];
        }
      }
    }

    return null;
  }

  /**
   * Get the Connect 4 winning line
   */
  private getConnect4WinningLine(board: Cell[], winner: Player): number[] | null {
    // Check horizontal
    for (let row = 0; row < C4_ROWS; row++) {
      for (let col = 0; col <= C4_COLUMNS - C4_CONNECT_LENGTH; col++) {
        const start = row * C4_COLUMNS + col;
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
    for (let row = 0; row <= C4_ROWS - C4_CONNECT_LENGTH; row++) {
      for (let col = 0; col < C4_COLUMNS; col++) {
        const start = row * C4_COLUMNS + col;
        const step = C4_COLUMNS;
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
    for (let row = 0; row <= C4_ROWS - C4_CONNECT_LENGTH; row++) {
      for (let col = 0; col <= C4_COLUMNS - C4_CONNECT_LENGTH; col++) {
        const start = row * C4_COLUMNS + col;
        const step = C4_COLUMNS + 1;
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
    for (let row = 0; row <= C4_ROWS - C4_CONNECT_LENGTH; row++) {
      for (let col = C4_CONNECT_LENGTH - 1; col < C4_COLUMNS; col++) {
        const start = row * C4_COLUMNS + col;
        const step = C4_COLUMNS - 1;
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

  /**
   * Check if Connect 4 game is a draw (board full, no winner)
   */
  private checkConnect4Draw(board: Cell[]): boolean {
    return board.every(cell => cell !== null) && !this.checkConnect4Winner(board);
  }
}
