import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
import { WebSocketService, BackendGameState, BackendPlayer } from './websocket.service';
import { TranslationService } from './translation.service';
import { GameState } from '../models/game-state.model';
import { Player } from '../models/player.model';
import { GameStatus } from '../models/game-status.enum';
import { Cell } from '../models/cell.model';

export interface OnlineGameInfo {
  roomId: string;
  currentPlayer: BackendPlayer;
  opponent: BackendPlayer | null;
  isMyTurn: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class OnlineGameService {
  // State management
  private gameState$ = new BehaviorSubject<GameState | null>(null);
  private onlineGameInfo$ = new BehaviorSubject<OnlineGameInfo | null>(null);
  private connectionStatus$ = new BehaviorSubject<boolean>(false);
  private errorMessage$ = new Subject<string>();
  
  // Cleanup subject
  private destroy$ = new Subject<void>();

  constructor(
    private wsService: WebSocketService,
    private translationService: TranslationService
  ) {
    this.initializeWebSocketListeners();
  }

  /**
   * Initialize all WebSocket event listeners
   */
  private initializeWebSocketListeners(): void {
    // Connection status
    this.wsService.getConnectionStatus()
      .pipe(takeUntil(this.destroy$))
      .subscribe(status => {
        this.connectionStatus$.next(status);
      });

    // Room joined event
    this.wsService.onRoomJoined()
      .pipe(takeUntil(this.destroy$))
      .subscribe(event => {
        this.handleRoomJoined(event.roomId, event.player, event.gameState, event.allPlayers);
      });

    // Player joined event
    this.wsService.onPlayerJoined()
      .pipe(takeUntil(this.destroy$))
      .subscribe(event => {
        this.handlePlayerJoined(event.player, event.gameState);
      });

    // Game update event
    this.wsService.onGameUpdate()
      .pipe(takeUntil(this.destroy$))
      .subscribe(event => {
        this.handleGameUpdate(event.gameState, event.players);
      });

    // Game over event
    this.wsService.onGameOver()
      .pipe(takeUntil(this.destroy$))
      .subscribe(event => {
        this.handleGameOver(event.gameState);
      });

    // Error event
    this.wsService.onError()
      .pipe(takeUntil(this.destroy$))
      .subscribe(event => {
        this.errorMessage$.next(event.message);
      });
  }

  /**
   * Connect to WebSocket server
   */
  connect(): void {
    this.wsService.connect();
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    this.wsService.disconnect();
    this.resetState();
  }

  /**
   * Join a game room
   */
  joinRoom(roomId: string, playerName: string): void {
    try {
      this.wsService.joinRoom(roomId, playerName);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.errorMessage$.next(this.translationService.translate('errors.game.joinRoomFailed', { message }));
    }
  }

  /**
   * Make a move in the current game
   */
  makeMove(position: number): void {
    const gameInfo = this.onlineGameInfo$.value;
    
    if (!gameInfo) {
      this.errorMessage$.next(this.translationService.translate('errors.game.noActiveGame'));
      return;
    }

    if (!gameInfo.isMyTurn) {
      this.errorMessage$.next(this.translationService.translate('errors.game.notYourTurn'));
      return;
    }

    const currentState = this.gameState$.value;
    if (!currentState) {
      this.errorMessage$.next(this.translationService.translate('errors.game.invalidGameState'));
      return;
    }

    if (currentState.board[position] !== null) {
      this.errorMessage$.next(this.translationService.translate('errors.game.cellOccupied'));
      return;
    }

    try {
      this.wsService.makeMove(gameInfo.roomId, position);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.errorMessage$.next(this.translationService.translate('errors.game.moveFailed', { message }));
    }
  }

  /**
   * Leave the current room
   */
  leaveRoom(): void {
    const gameInfo = this.onlineGameInfo$.value;
    
    if (gameInfo) {
      try {
        this.wsService.leaveRoom(gameInfo.roomId);
      } catch (error) {
        console.error('Error leaving room:', error);
      }
    }
    
    this.resetState();
  }

  /**
   * Reset the current game
   */
  resetGame(): void {
    const gameInfo = this.onlineGameInfo$.value;
    
    if (!gameInfo) {
      this.errorMessage$.next(this.translationService.translate('errors.game.noActiveGame'));
      return;
    }

    try {
      this.wsService.resetGame(gameInfo.roomId);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.errorMessage$.next(this.translationService.translate('errors.game.resetFailed', { message }));
    }
  }

  /**
   * Handle room joined event
   */
  private handleRoomJoined(roomId: string, player: BackendPlayer, backendState: BackendGameState, allPlayers: BackendPlayer[]): void {
    console.log('handleRoomJoined called:', { 
      roomId, 
      player, 
      backendState, 
      allPlayers 
    });
    
    const gameState = this.convertBackendToFrontendState(backendState);
    this.gameState$.next(gameState);

    const opponent = allPlayers.find(p => p.id !== player.id) || null;
    console.log('Opponent found:', opponent);

    const isMyTurn = this.calculateIsMyTurn(player.symbol, backendState.currentTurn);
    console.log('Is my turn calculation:', { 
      mySymbol: player.symbol, 
      currentTurn: backendState.currentTurn, 
      isMyTurn 
    });

    const gameInfo: OnlineGameInfo = {
      roomId,
      currentPlayer: player,
      opponent,
      isMyTurn
    };

    console.log('Setting online game info:', gameInfo);
    this.onlineGameInfo$.next(gameInfo);
  }

  /**
   * Handle player joined event
   */
  private handlePlayerJoined(player: BackendPlayer, backendState: BackendGameState): void {
    const currentInfo = this.onlineGameInfo$.value;
    
    if (!currentInfo) {
      return;
    }

    // Update opponent info
    const updatedInfo: OnlineGameInfo = {
      ...currentInfo,
      opponent: player,
      isMyTurn: this.calculateIsMyTurn(currentInfo.currentPlayer.symbol, backendState.currentTurn)
    };

    this.onlineGameInfo$.next(updatedInfo);

    // Update game state
    const gameState = this.convertBackendToFrontendState(backendState);
    this.gameState$.next(gameState);
  }

  /**
   * Handle game update event
   */
  private handleGameUpdate(backendState: BackendGameState, players?: BackendPlayer[]): void {
    console.log('handleGameUpdate called:', { backendState, players });
    
    const currentInfo = this.onlineGameInfo$.value;
    
    if (!currentInfo) {
      console.log('No current info, skipping game update');
      return;
    }

    const gameState = this.convertBackendToFrontendState(backendState);
    this.gameState$.next(gameState);

    let opponent = currentInfo.opponent;
    if (players && players.length > 0) {
      const opponentPlayer = players.find(p => p.id !== currentInfo.currentPlayer.id);
      if (opponentPlayer) {
        console.log('Updated opponent from game update:', opponentPlayer);
        opponent = opponentPlayer;
      }
    }

    const isMyTurn = this.calculateIsMyTurn(currentInfo.currentPlayer.symbol, backendState.currentTurn);
    console.log('Is my turn calculation in update:', { 
      mySymbol: currentInfo.currentPlayer.symbol, 
      currentTurn: backendState.currentTurn, 
      isMyTurn 
    });

    const updatedInfo: OnlineGameInfo = {
      ...currentInfo,
      opponent,
      isMyTurn
    };

    console.log('Updating online game info:', updatedInfo);
    this.onlineGameInfo$.next(updatedInfo);
  }

  /**
   * Handle game over event
   */
  private handleGameOver(backendState: BackendGameState): void {
    const gameState = this.convertBackendToFrontendState(backendState);
    this.gameState$.next(gameState);

    const currentInfo = this.onlineGameInfo$.value;
    if (currentInfo) {
      const updatedInfo: OnlineGameInfo = {
        ...currentInfo,
        isMyTurn: false
      };
      this.onlineGameInfo$.next(updatedInfo);
    }
  }

  /**
   * Convert backend game state to frontend game state
   */
  private convertBackendToFrontendState(backendState: BackendGameState): GameState {
    const board = this.convertBackendBoard(backendState.board);
    const currentPlayer = this.convertSymbolToPlayer(backendState.currentTurn);
    const status = this.convertBackendStatus(backendState);

    return {
      board,
      currentPlayer,
      status,
      scores: {
        unicorn: 0,
        cat: 0
      },
      winningLine: backendState.winningLine
    };
  }

  /**
   * Convert backend board to frontend board
   */
  private convertBackendBoard(backendBoard: ('X' | 'O' | null)[]): Cell[] {
    return backendBoard.map(cell => {
      if (cell === 'X') return Player.UNICORN;
      if (cell === 'O') return Player.CAT;
      return null;
    });
  }

  /**
   * Convert backend symbol to frontend player
   */
  private convertSymbolToPlayer(symbol: 'X' | 'O'): Player {
    return symbol === 'X' ? Player.UNICORN : Player.CAT;
  }

  /**
   * Convert backend status to frontend status
   */
  private convertBackendStatus(backendState: BackendGameState): GameStatus {
    if (backendState.status === 'finished') {
      if (backendState.winner === 'X') return GameStatus.UNICORN_WINS;
      if (backendState.winner === 'O') return GameStatus.CAT_WINS;
      if (backendState.winner === 'draw') return GameStatus.DRAW;
    }
    return GameStatus.IN_PROGRESS;
  }

  /**
   * Calculate if it's the current player's turn
   */
  private calculateIsMyTurn(mySymbol: 'X' | 'O', currentTurn: 'X' | 'O'): boolean {
    return mySymbol === currentTurn;
  }

  /**
   * Reset all state
   */
  private resetState(): void {
    this.gameState$.next(null);
    this.onlineGameInfo$.next(null);
  }

  /**
   * Get current game state as observable
   */
  getGameState(): Observable<GameState | null> {
    return this.gameState$.asObservable();
  }

  /**
   * Get current online game info as observable
   */
  getOnlineGameInfo(): Observable<OnlineGameInfo | null> {
    return this.onlineGameInfo$.asObservable();
  }

  /**
   * Get connection status as observable
   */
  getConnectionStatus(): Observable<boolean> {
    return this.connectionStatus$.asObservable();
  }

  /**
   * Get error messages as observable
   */
  getErrorMessages(): Observable<string> {
    return this.errorMessage$.asObservable();
  }

  /**
   * Get current game state value
   */
  getCurrentGameState(): GameState | null {
    return this.gameState$.value;
  }

  /**
   * Get current online game info value
   */
  getCurrentOnlineGameInfo(): OnlineGameInfo | null {
    return this.onlineGameInfo$.value;
  }

  /**
   * Check if currently connected
   */
  isConnected(): boolean {
    return this.connectionStatus$.value;
  }

  /**
   * Cleanup on service destruction
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.disconnect();
  }
}
