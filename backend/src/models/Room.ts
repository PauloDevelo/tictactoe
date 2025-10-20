import { Player } from './Player';
import { GameState, createInitialGameState } from './GameState';

export type RoomStatus = 'waiting' | 'ready' | 'playing' | 'finished';

export interface Room {
  id: string;
  name: string;
  players: Player[];
  maxPlayers: number;
  gameState: GameState;
  status: RoomStatus;
  createdAt: Date;
}

export const createRoom = (id: string, name: string): Room => ({
  id,
  name,
  players: [],
  maxPlayers: 2,
  gameState: createInitialGameState(),
  status: 'waiting',
  createdAt: new Date(),
});

export const addPlayerToRoom = (room: Room, player: Player): Room => {
  if (room.players.length >= room.maxPlayers) {
    throw new Error('Room is full');
  }

  if (room.players.some((p) => p.id === player.id)) {
    throw new Error('Player already in room');
  }

  return {
    ...room,
    players: [...room.players, player],
  };
};

export const removePlayerFromRoom = (room: Room, playerId: string): Room => ({
  ...room,
  players: room.players.filter((p) => p.id !== playerId),
});

export const updatePlayerInRoom = (room: Room, player: Player): Room => ({
  ...room,
  players: room.players.map((p) => (p.id === player.id ? player : p)),
});

export const updateRoomStatus = (room: Room, status: RoomStatus): Room => ({
  ...room,
  status,
});

export const updateGameState = (room: Room, gameState: GameState): Room => ({
  ...room,
  gameState,
});

export const isRoomFull = (room: Room): boolean =>
  room.players.length >= room.maxPlayers;

export const areAllPlayersReady = (room: Room): boolean =>
  room.players.length === room.maxPlayers &&
  room.players.every((p) => p.isReady);
