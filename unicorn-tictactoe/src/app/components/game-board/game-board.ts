import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, merge } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';
import { GameCell } from '../game-cell/game-cell';
import { Connect4Board } from '../connect4-board/connect4-board';
import { Player } from '../../models/player.model';
import { Cell } from '../../models/cell.model';
import { GameStatus } from '../../models/game-status.enum';
import { GameType } from '../../models/game-type.model';
import { GameMode } from '../../models/game-mode.model';
import { GameService } from '../../services/game.service';
import { OnlineGameService } from '../../services/online-game.service';
import { TranslationService } from '../../services/translation.service';

@Component({
  selector: 'app-game-board',
  imports: [CommonModule, GameCell, Connect4Board],
  templateUrl: './game-board.html',
  styleUrl: './game-board.css'
})
export class GameBoard implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  @Input() gameType: GameType = 'tictactoe';
  @Input() currentMode: GameMode | null = null;

  tttCells: number[] = Array(9).fill(0).map((_, i) => i);
  c4Rows: number[] = Array(6).fill(0).map((_, i) => i);
  c4Columns: number[] = Array(7).fill(0).map((_, i) => i);
  board: Cell[] = [];
  currentPlayer: Player = Player.UNICORN;
  isGameOver: boolean = false;
  winningLine: number[] | null = null;

  // Online mode state
  isOnlineMode = false;
  isMyTurn = false;

  constructor(
    private gameService: GameService,
    private onlineGameService: OnlineGameService,
    public translationService: TranslationService
  ) {}

  ngOnInit(): void {
    // Subscribe to online game info to determine mode
    this.onlineGameService.getOnlineGameInfo()
      .pipe(takeUntil(this.destroy$))
      .subscribe(info => {
        this.isOnlineMode = info !== null;
        this.isMyTurn = info?.isMyTurn ?? false;
      });

    // Subscribe to game type changes from GameService
    this.gameService.gameType$
      .pipe(takeUntil(this.destroy$))
      .subscribe(type => {
        this.gameType = type;
      });

    // Subscribe to local game state
    this.gameService.gameState$
      .pipe(
        takeUntil(this.destroy$),
        filter(() => !this.isOnlineMode)
      )
      .subscribe(state => {
        this.updateBoardState(state);
      });

    // Subscribe to online game state
    this.onlineGameService.getGameState()
      .pipe(
        takeUntil(this.destroy$),
        filter(state => state !== null && this.isOnlineMode)
      )
      .subscribe(state => {
        if (state) {
          this.updateBoardState(state);
        }
      });
  }

  /**
   * Update board state from game state
   */
  private updateBoardState(state: any): void {
    this.board = state.board;
    this.currentPlayer = state.currentPlayer;
    this.isGameOver = state.status !== GameStatus.IN_PROGRESS;
    this.winningLine = state.winningLine;
  }

  getCellPlayer(index: number): Player | null {
    return this.board[index];
  }

  isWinningCell(index: number): boolean {
    return this.winningLine !== null && this.winningLine.includes(index);
  }

  /**
   * Check if a cell is clickable
   */
  isCellClickable(index: number): boolean {
    // Cell must be empty
    if (this.board[index] !== null) {
      return false;
    }

    // Game must not be over
    if (this.isGameOver) {
      return false;
    }

    // In online mode, must be player's turn
    if (this.isOnlineMode && !this.isMyTurn) {
      return false;
    }

    // In AI mode, the human plays UNICORN and the AI plays CAT
    if (this.currentMode === 'ai' && this.currentPlayer === Player.CAT) {
      return false;
    }

    return true;
  }

  onCellClick(index: number): void {
    if (!this.isCellClickable(index)) {
      return;
    }

    if (this.isOnlineMode) {
      this.onlineGameService.makeMove(index);
    } else {
      this.gameService.makeMove(index);
    }
  }

  /**
   * Handle Connect 4 column click
   */
  onColumnClick(col: number): void {
    if (!this.isCellClickable(col)) {
      return;
    }

    if (this.isOnlineMode) {
      this.onlineGameService.makeMove(col);
    } else {
      this.gameService.makeMove(col);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
