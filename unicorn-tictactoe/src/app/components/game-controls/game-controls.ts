import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';
import { GameStatus } from '../../models/game-status.enum';
import { Player } from '../../models/player.model';
import { GameService } from '../../services/game.service';
import { OnlineGameService } from '../../services/online-game.service';

@Component({
  selector: 'app-game-controls',
  imports: [CommonModule],
  templateUrl: './game-controls.html',
  styleUrl: './game-controls.css'
})
export class GameControls implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  gameStatus: GameStatus = GameStatus.IN_PROGRESS;
  currentPlayer: Player = Player.UNICORN;

  // Online mode state
  isOnlineMode = false;
  isMyTurn = false;
  mySymbol: 'X' | 'O' | null = null;

  GameStatus = GameStatus; // Expose enum to template
  Player = Player;

  constructor(
    private gameService: GameService,
    private onlineGameService: OnlineGameService
  ) {}

  ngOnInit(): void {
    // Subscribe to online game info to determine mode
    this.onlineGameService.getOnlineGameInfo()
      .pipe(takeUntil(this.destroy$))
      .subscribe(info => {
        this.isOnlineMode = info !== null;
        this.isMyTurn = info?.isMyTurn ?? false;
        this.mySymbol = info?.currentPlayer.symbol ?? null;
      });

    // Subscribe to local game state
    this.gameService.gameState$
      .pipe(
        takeUntil(this.destroy$),
        filter(() => !this.isOnlineMode)
      )
      .subscribe(state => {
        this.gameStatus = state.status;
        this.currentPlayer = state.currentPlayer;
      });

    // Subscribe to online game state
    this.onlineGameService.getGameState()
      .pipe(
        takeUntil(this.destroy$),
        filter(state => state !== null && this.isOnlineMode)
      )
      .subscribe(state => {
        if (state) {
          this.gameStatus = state.status;
          this.currentPlayer = state.currentPlayer;
        }
      });
  }

  get statusMessage(): string {
    if (this.isOnlineMode) {
      return this.getOnlineStatusMessage();
    }
    return this.getLocalStatusMessage();
  }

  private getLocalStatusMessage(): string {
    switch (this.gameStatus) {
      case GameStatus.UNICORN_WINS:
        return '🦄 Unicorn Wins! 🎉';
      case GameStatus.CAT_WINS:
        return '🐱 Cat Wins! 🎉';
      case GameStatus.DRAW:
        return '🤝 It\'s a Draw!';
      case GameStatus.IN_PROGRESS:
        return this.currentPlayer === Player.UNICORN 
          ? '🦄 Unicorn\'s Turn' 
          : '🐱 Cat\'s Turn';
      default:
        return '';
    }
  }

  private getOnlineStatusMessage(): string {
    switch (this.gameStatus) {
      case GameStatus.UNICORN_WINS:
        return this.mySymbol === 'X' ? '🎉 You Win!' : '😔 You Lose';
      case GameStatus.CAT_WINS:
        return this.mySymbol === 'O' ? '🎉 You Win!' : '😔 You Lose';
      case GameStatus.DRAW:
        return '🤝 It\'s a Draw!';
      case GameStatus.IN_PROGRESS:
        if (this.isMyTurn) {
          return '✨ Your Turn';
        } else {
          return '⏳ Opponent\'s Turn';
        }
      default:
        return '';
    }
  }

  get statusClass(): string {
    if (this.isOnlineMode) {
      switch (this.gameStatus) {
        case GameStatus.UNICORN_WINS:
          return this.mySymbol === 'X' ? 'you-win' : 'you-lose';
        case GameStatus.CAT_WINS:
          return this.mySymbol === 'O' ? 'you-win' : 'you-lose';
        case GameStatus.DRAW:
          return 'draw';
        default:
          return this.isMyTurn ? 'your-turn' : 'opponent-turn';
      }
    }

    switch (this.gameStatus) {
      case GameStatus.UNICORN_WINS:
        return 'unicorn-wins';
      case GameStatus.CAT_WINS:
        return 'cat-wins';
      case GameStatus.DRAW:
        return 'draw';
      default:
        return 'in-progress';
    }
  }

  get isGameOver(): boolean {
    return this.gameStatus !== GameStatus.IN_PROGRESS;
  }

  onResetClick(): void {
    if (this.isOnlineMode) {
      this.onlineGameService.resetGame();
    } else {
      this.gameService.resetGame();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
