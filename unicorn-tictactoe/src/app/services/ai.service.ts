import { Injectable } from '@angular/core';
import { GameService } from './game.service';
import { GameState } from '../models/game-state.model';
import { Player } from '../models/player.model';
import { GameStatus } from '../models/game-status.enum';
import { GameType } from '../models/game-type.model';
import { Cell } from '../models/cell.model';
import { WINNING_COMBINATIONS } from '../models/winning-line.model';

const C4_COLUMNS = 7;
const C4_ROWS = 6;
const C4_CONNECT_LENGTH = 4;

/**
 * AI opponent service for the "vs AI" game mode.
 *
 * The human always plays as UNICORN and the AI always plays as CAT.
 * The service computes legal moves for both Tic-Tac-Toe and Connect 4,
 * preferring immediate wins, then blocking the opponent's immediate wins,
 * then falling back to a simple positional heuristic.
 */
@Injectable({
  providedIn: 'root'
})
export class AiService {
  constructor(private gameService: GameService) {}

  /**
   * Schedule the AI to make a move after a short delay.
   * The current turn is re-validated after the delay to avoid making
   * stale moves when the game state has changed.
   *
   * @param delayMs - Delay before the AI moves (default 600ms)
   * @returns A function that cancels the scheduled move
   */
  scheduleMove(delayMs: number = 600): () => void {
    const state = this.gameService.getCurrentState();
    if (!this.isAiTurn(state)) {
      return () => {};
    }

    const timeoutId = window.setTimeout(() => {
      const currentState = this.gameService.getCurrentState();
      if (!this.isAiTurn(currentState)) {
        return;
      }

      const gameType = this.gameService.getGameType();
      const move = this.computeMove(gameType, currentState);
      if (move !== -1) {
        this.gameService.makeMove(move);
      }
    }, delayMs);

    return () => window.clearTimeout(timeoutId);
  }

  /**
   * Compute the AI's next move for the given game type and state.
   * Returns the board cell index for Tic-Tac-Toe or the column index for Connect 4.
   * Returns -1 if no move is available or it is not the AI's turn.
   */
  computeMove(gameType: GameType, state: GameState): number {
    if (!this.isAiTurn(state)) {
      return -1;
    }

    if (gameType === 'connect4') {
      return this.computeConnect4Move(state.board);
    }

    return this.computeTictactoeMove(state.board);
  }

  private isAiTurn(state: GameState): boolean {
    return state.status === GameStatus.IN_PROGRESS && state.currentPlayer === Player.CAT;
  }

  /**
   * Tic-Tac-Toe move selection:
   * 1. Win if possible
   * 2. Block opponent's immediate win
   * 3. Prefer center, then corners, then edges
   */
  private computeTictactoeMove(board: Cell[]): number {
    const aiPlayer = Player.CAT;
    const humanPlayer = Player.UNICORN;

    const winningMove = this.findTictactoeWinningMove(board, aiPlayer);
    if (winningMove !== -1) {
      return winningMove;
    }

    const blockingMove = this.findTictactoeWinningMove(board, humanPlayer);
    if (blockingMove !== -1) {
      return blockingMove;
    }

    // Center > corners > edges
    const preferredOrder = [4, 0, 2, 6, 8, 1, 3, 5, 7];
    for (const index of preferredOrder) {
      if (board[index] === null) {
        return index;
      }
    }

    return -1;
  }

  /**
   * Find a move that gives the specified player an immediate 3-in-a-row.
   */
  private findTictactoeWinningMove(board: Cell[], player: Player): number {
    for (const [a, b, c] of WINNING_COMBINATIONS) {
      const values = [board[a], board[b], board[c]];
      const playerCount = values.filter(value => value === player).length;
      const emptyCount = values.filter(value => value === null).length;

      if (playerCount === 2 && emptyCount === 1) {
        const emptyLocalIndex = values.indexOf(null);
        return [a, b, c][emptyLocalIndex];
      }
    }
    return -1;
  }

  /**
   * Connect 4 move selection:
   * 1. Win if possible
   * 2. Block opponent's immediate win
   * 3. Prefer center columns
   */
  private computeConnect4Move(board: Cell[]): number {
    const aiPlayer = Player.CAT;
    const humanPlayer = Player.UNICORN;

    const winningMove = this.findConnect4WinningMove(board, aiPlayer);
    if (winningMove !== -1) {
      return winningMove;
    }

    const blockingMove = this.findConnect4WinningMove(board, humanPlayer);
    if (blockingMove !== -1) {
      return blockingMove;
    }

    return this.findBestConnect4Column(board);
  }

  /**
   * Find a column that gives the specified player an immediate 4-in-a-row.
   */
  private findConnect4WinningMove(board: Cell[], player: Player): number {
    for (let col = 0; col < C4_COLUMNS; col++) {
      const dropPos = this.getC4DropPosition(board, col);
      if (dropPos !== -1 && this.wouldWinAfterDrop(board, dropPos, player)) {
        return col;
      }
    }
    return -1;
  }

  /**
   * Choose the highest non-full column using a simple center-bias heuristic.
   */
  private findBestConnect4Column(board: Cell[]): number {
    // Higher score for columns closer to the center
    const columnScores = [1, 4, 7, 10, 7, 4, 1];
    let bestColumn = -1;
    let bestScore = -1;

    for (let col = 0; col < C4_COLUMNS; col++) {
      const dropPos = this.getC4DropPosition(board, col);
      if (dropPos === -1) {
        continue;
      }

      if (columnScores[col] > bestScore) {
        bestScore = columnScores[col];
        bestColumn = col;
      }
    }

    return bestColumn;
  }

  /**
   * Determine whether dropping a piece for `player` at `dropPos` creates a 4-in-a-row.
   */
  private wouldWinAfterDrop(board: Cell[], dropPos: number, player: Player): boolean {
    const simulatedBoard = [...board];
    simulatedBoard[dropPos] = player;
    return this.checkConnect4Winner(simulatedBoard) === player;
  }

  /**
   * Get the drop position for Connect 4 (gravity).
   * Returns the index of the lowest empty cell in the column, or -1 if full.
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
    return -1;
  }

  /**
   * Check if there is a Connect 4 winner (4-in-a-row).
   */
  private checkConnect4Winner(board: Cell[]): Player | null {
    // Horizontal
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

    // Vertical
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

    // Diagonal (top-left to bottom-right)
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

    // Anti-diagonal (top-right to bottom-left)
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
}
