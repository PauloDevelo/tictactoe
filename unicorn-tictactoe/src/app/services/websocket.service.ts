import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable, Subject, BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';

// Backend data types (matching server models)
export type CellValue = 'X' | 'O' | null;
export type GameStatus = 'waiting' | 'playing' | 'finished';

export interface BackendPlayer {
  id: string;
  name: string;
  symbol: 'X' | 'O';
  isReady: boolean;
}

export interface BackendGameState {
  board: CellValue[];
  currentTurn: 'X' | 'O';
  status: GameStatus;
  winner: 'X' | 'O' | 'draw' | null;
  winningLine: number[] | null;
}

export interface RoomJoinedEvent {
  roomId: string;
  player: BackendPlayer;
  gameState: BackendGameState;
  allPlayers: BackendPlayer[];
}

export interface PlayerJoinedEvent {
  player: BackendPlayer;
  gameState: BackendGameState;
}

export interface GameUpdateEvent {
  gameState: BackendGameState;
  players?: BackendPlayer[];
}

export interface GameOverEvent {
  winner: BackendPlayer | null;
  winningLine: number[] | null;
  gameState: BackendGameState;
}

export interface ErrorEvent {
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private socket: Socket | null = null;
  private connectionStatus$ = new BehaviorSubject<boolean>(false);

  // Event subjects
  private roomJoined$ = new Subject<RoomJoinedEvent>();
  private playerJoined$ = new Subject<PlayerJoinedEvent>();
  private gameUpdate$ = new Subject<GameUpdateEvent>();
  private gameOver$ = new Subject<GameOverEvent>();
  private error$ = new Subject<ErrorEvent>();

  constructor() {}

  /**
   * Initialize WebSocket connection
   */
  connect(): void {
    if (this.socket?.connected) {
      return;
    }

    this.socket = io(environment.wsUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5
    });

    this.setupEventListeners();
  }

  /**
   * Disconnect WebSocket
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connectionStatus$.next(false);
    }
  }

  /**
   * Setup all WebSocket event listeners
   */
  private setupEventListeners(): void {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      this.connectionStatus$.next(true);
    });

    this.socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
      this.connectionStatus$.next(false);
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      this.connectionStatus$.next(false);
    });

    // Game events - matching backend event names with colons
    this.socket.on('room:joined', (data: any) => {
      console.log('room:joined event received:', data);
      if (data.room) {
        const room = data.room;
        console.log('My socket.id:', this.socket?.id);
        console.log('All players in room:', room.players);
        const myPlayer = room.players.find((p: any) => p.id === this.socket?.id);
        console.log('Found my player:', myPlayer);
        if (myPlayer) {
          this.roomJoined$.next({
            roomId: room.id,
            player: myPlayer,
            gameState: room.gameState,
            allPlayers: room.players
          });
        } else {
          console.error('Could not find my player in room! Socket ID mismatch?');
        }
      }
    });

    this.socket.on('room:updated', (data: any) => {
      console.log('room:updated event received:', data);
      if (data.room && data.room.gameState) {
        this.gameUpdate$.next({
          gameState: data.room.gameState,
          players: data.room.players
        });
      }
    });

    this.socket.on('game:move', (data: any) => {
      console.log('game:move event received:', data);
      if (data.room && data.room.gameState) {
        this.gameUpdate$.next({
          gameState: data.room.gameState,
          players: data.room.players
        });
      }
    });

    this.socket.on('game:finished', (data: any) => {
      console.log('game:finished event received:', data);
      if (data.room && data.room.gameState) {
        this.gameOver$.next({
          winner: null, // Will be determined from gameState
          winningLine: data.room.gameState.winningLine,
          gameState: data.room.gameState
        });
      }
    });

    this.socket.on('error', (data: ErrorEvent) => {
      console.error('WebSocket error:', data);
      this.error$.next(data);
    });
  }

  /**
   * Join a game room
   */
  joinRoom(roomId: string, playerName: string): void {
    if (!this.socket?.connected) {
      throw new Error('WebSocket not connected');
    }
    console.log('Emitting room:join with:', { roomId, playerName });
    this.socket.emit('room:join', { roomId, playerName });
  }

  /**
   * Make a move in the game
   */
  makeMove(roomId: string, position: number): void {
    if (!this.socket?.connected) {
      throw new Error('WebSocket not connected');
    }
    console.log('Emitting game:move with:', { roomId, position });
    this.socket.emit('game:move', { roomId, position });
  }

  /**
   * Leave the current room
   */
  leaveRoom(roomId: string): void {
    if (!this.socket?.connected) {
      throw new Error('WebSocket not connected');
    }
    console.log('Emitting room:leave with:', { roomId });
    this.socket.emit('room:leave', { roomId });
  }

  /**
   * Reset the game in the current room
   */
  resetGame(roomId: string): void {
    if (!this.socket?.connected) {
      throw new Error('WebSocket not connected');
    }
    console.log('Emitting game:reset with:', { roomId });
    this.socket.emit('game:reset', { roomId });
  }

  /**
   * Observable for connection status
   */
  getConnectionStatus(): Observable<boolean> {
    return this.connectionStatus$.asObservable();
  }

  /**
   * Observable for room joined events
   */
  onRoomJoined(): Observable<RoomJoinedEvent> {
    return this.roomJoined$.asObservable();
  }

  /**
   * Observable for player joined events
   */
  onPlayerJoined(): Observable<PlayerJoinedEvent> {
    return this.playerJoined$.asObservable();
  }

  /**
   * Observable for game update events
   */
  onGameUpdate(): Observable<GameUpdateEvent> {
    return this.gameUpdate$.asObservable();
  }

  /**
   * Observable for game over events
   */
  onGameOver(): Observable<GameOverEvent> {
    return this.gameOver$.asObservable();
  }

  /**
   * Observable for error events
   */
  onError(): Observable<ErrorEvent> {
    return this.error$.asObservable();
  }

  /**
   * Check if WebSocket is currently connected
   */
  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }
}
