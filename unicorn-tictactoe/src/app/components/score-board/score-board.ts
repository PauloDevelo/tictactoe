import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';
import { Player } from '../../models/player.model';
import { GameService } from '../../services/game.service';
import { OnlineGameService } from '../../services/online-game.service';

@Component({
  selector: 'app-score-board',
  imports: [CommonModule],
  templateUrl: './score-board.html',
  styleUrl: './score-board.css'
})
export class ScoreBoard implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  unicornScore: number = 0;
  catScore: number = 0;
  currentPlayer: Player = Player.UNICORN;

  // Online mode - hide scoreboard
  isOnlineMode = false;

  Player = Player; // Expose enum to template

  constructor(
    private gameService: GameService,
    private onlineGameService: OnlineGameService
  ) {}

  ngOnInit(): void {
    // Check if in online mode
    this.onlineGameService.getOnlineGameInfo()
      .pipe(takeUntil(this.destroy$))
      .subscribe(info => {
        this.isOnlineMode = info !== null;
      });

    // Subscribe to local game state only
    this.gameService.gameState$
      .pipe(
        takeUntil(this.destroy$),
        filter(() => !this.isOnlineMode)
      )
      .subscribe(state => {
        this.unicornScore = state.scores.unicorn;
        this.catScore = state.scores.cat;
        this.currentPlayer = state.currentPlayer;
      });
  }

  get isUnicornTurn(): boolean {
    return this.currentPlayer === Player.UNICORN;
  }

  get isCatTurn(): boolean {
    return this.currentPlayer === Player.CAT;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
