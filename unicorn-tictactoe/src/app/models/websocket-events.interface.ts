import { Room } from './room.interface';
import { OnlinePlayer } from './online-player.interface';
import { GameState } from './game-state.model';

// Client to Server Events
export interface JoinRoomEvent {
  roomId: string;
  playerName: string;
}

export interface MakeMoveEvent {
  roomId: string;
  position: number;
}

export interface PlayerReadyEvent {
  roomId: string;
}

export interface LeaveRoomEvent {
  roomId: string;
}

// Server to Client Events
export interface RoomUpdatedEvent {
  room: Room;
}

export interface PlayerJoinedEvent {
  player: OnlinePlayer;
  room: Room;
}

export interface PlayerLeftEvent {
  playerId: string;
  room: Room;
}

export interface GameStartedEvent {
  gameState: GameState;
}

export interface MoveMadeEvent {
  gameState: GameState;
  playerId: string;
  position: number;
}

export interface GameOverEvent {
  gameState: GameState;
  winner: string | null;
}

export interface ErrorEvent {
  message: string;
  code?: string;
}

// Union types for type safety
export type ClientEvent = 
  | { type: 'joinRoom'; data: JoinRoomEvent }
  | { type: 'makeMove'; data: MakeMoveEvent }
  | { type: 'playerReady'; data: PlayerReadyEvent }
  | { type: 'leaveRoom'; data: LeaveRoomEvent };

export type ServerEvent =
  | { type: 'roomUpdated'; data: RoomUpdatedEvent }
  | { type: 'playerJoined'; data: PlayerJoinedEvent }
  | { type: 'playerLeft'; data: PlayerLeftEvent }
  | { type: 'gameStarted'; data: GameStartedEvent }
  | { type: 'moveMade'; data: MoveMadeEvent }
  | { type: 'gameOver'; data: GameOverEvent }
  | { type: 'error'; data: ErrorEvent };
