import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { GameState } from '../models/game-state.model';
import { Player } from '../models/player.model';
import { GameStatus } from '../models/game-status.enum';
import { Cell } from '../models/cell.model';
import { WINNING_COMBINATIONS } from '../models/winning-line.model';

@Injectable({
  providedIn: 'root'
})
export class GameService {
  private lastStartingPlayer: Player = Player.CAT; // Track last starting player (starts as CAT so first game starts with UNICORN)
  
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
   * Initialize a completely new game (resets scores)
   */
  initializeGame(): void {
    // Alternate the starting player
    this.lastStartingPlayer = this.getNextPlayer(this.lastStartingPlayer);
    
    this.initialState = {
      board: Array(9).fill(null) as Cell[],
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
    
    const newState: GameState = {
      board: Array(9).fill(null) as Cell[],
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
   * Make a move at the specified cell index
   * @param cellIndex - Index of the cell (0-8)
   * @returns true if move was successful, false otherwise
   */
  makeMove(cellIndex: number): boolean {
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
   * Check if a move is valid
   * @param cellIndex - Index of the cell (0-8)
   * @returns true if move is valid, false otherwise
   */
  isValidMove(cellIndex: number): boolean {
    const currentState = this.gameStateSubject.value;
    
    // Check if game is over
    if (currentState.status !== GameStatus.IN_PROGRESS) {
      return false;
    }

    // Check if index is valid
    if (cellIndex < 0 || cellIndex > 8) {
      return false;
    }

    // Check if cell is empty
    return this.isCellEmpty(cellIndex);
  }

  /**
   * Check if a cell is empty
   * @param cellIndex - Index of the cell (0-8)
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
   * Check if there is a winner
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
   * Get the winning line combination
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
   * Check if the game is a draw
   * @param board - Current board state
   * @returns true if draw, false otherwise
   */
  private checkDraw(board: Cell[]): boolean {
    return board.every(cell => cell !== null) && !this.checkWinner(board);
  }
}
