import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { GameBoard } from './components/game-board/game-board';
import { ScoreBoard } from './components/score-board/score-board';
import { GameControls } from './components/game-controls/game-controls';
import { GameModeSelectorComponent } from './components/game-mode-selector/game-mode-selector.component';
import { RoomListComponent } from './components/room-list/room-list.component';
import { CreateRoomComponent, CreateRoomData } from './components/create-room/create-room.component';
import { JoinRoomComponent } from './components/join-room/join-room.component';
import { GameMode } from './models/game-mode.model';
import { OnlineGameService } from './services/online-game.service';
import { GameService } from './services/game.service';
import { Room } from './services/room.service';

@Component({
  selector: 'app-root',
  imports: [
    CommonModule,
    GameBoard,
    ScoreBoard,
    GameControls,
    GameModeSelectorComponent,
    RoomListComponent,
    CreateRoomComponent,
    JoinRoomComponent
  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Game mode state
  currentMode: GameMode | null = null;
  showModeSelector = true;

  // Online game state
  isOnlineMode = false;
  isConnected = false;
  connectionError: string | null = null;
  currentRoomId: string | null = null;
  playerName: string | null = null;

  constructor(
    private onlineGameService: OnlineGameService,
    private gameService: GameService
  ) {}

  ngOnInit(): void {
    // Subscribe to online game connection status
    this.onlineGameService.getConnectionStatus()
      .pipe(takeUntil(this.destroy$))
      .subscribe(status => {
        this.isConnected = status;
      });

    // Subscribe to online game info
    this.onlineGameService.getOnlineGameInfo()
      .pipe(takeUntil(this.destroy$))
      .subscribe(info => {
        if (info) {
          this.currentRoomId = info.roomId;
        } else {
          this.currentRoomId = null;
        }
      });

    // Subscribe to error messages
    this.onlineGameService.getErrorMessages()
      .pipe(takeUntil(this.destroy$))
      .subscribe(error => {
        this.connectionError = error;
        // Auto-clear error after 5 seconds
        setTimeout(() => {
          this.connectionError = null;
        }, 5000);
      });
  }

  /**
   * Handle game mode selection
   */
  onModeSelected(mode: GameMode): void {
    this.currentMode = mode;
    this.showModeSelector = false;

    if (mode === 'online') {
      this.isOnlineMode = true;
      // Connect to WebSocket server
      this.onlineGameService.connect();
    } else {
      this.isOnlineMode = false;
      // Initialize local game
      this.gameService.initializeGame();
    }
  }

  /**
   * Handle room created event
   */
  onRoomCreated(data: CreateRoomData): void {
    this.onlineGameService.joinRoom(data.room.id, data.playerName);
    this.currentRoomId = data.room.id;
    this.playerName = data.playerName;
  }

  /**
   * Handle room joined event
   */
  onRoomJoined(data: { roomId: string; playerName: string }): void {
    this.currentRoomId = data.roomId;
    this.playerName = data.playerName;
  }

  /**
   * Return to mode selector
   */
  returnToModeSelector(): void {
    // Leave room if in online mode
    if (this.isOnlineMode && this.currentRoomId) {
      this.onlineGameService.leaveRoom();
    }

    // Disconnect from WebSocket
    if (this.isOnlineMode) {
      this.onlineGameService.disconnect();
    }

    // Reset state
    this.currentMode = null;
    this.showModeSelector = true;
    this.isOnlineMode = false;
    this.currentRoomId = null;
    this.playerName = null;
    this.connectionError = null;

    // Reset local game
    this.gameService.initializeGame();
  }

  /**
   * Leave current room
   */
  leaveRoom(): void {
    if (this.currentRoomId) {
      this.onlineGameService.leaveRoom();
      this.currentRoomId = null;
      this.playerName = null;
    }
  }

  ngOnDestroy(): void {
    // Cleanup
    if (this.isOnlineMode) {
      this.onlineGameService.disconnect();
    }

    this.destroy$.next();
    this.destroy$.complete();
  }
}
