import {
  Room,
  createRoom,
  addPlayerToRoom,
  removePlayerFromRoom,
  updatePlayerInRoom,
  updateRoomStatus,
  updateGameState,
  isRoomFull,
  areAllPlayersReady,
} from '../models/Room';
import { Player, createPlayer, setPlayerReady } from '../models/Player';
import {
  GameState,
  createInitialGameState,
  makeMove,
  startGame,
  resetGame,
} from '../models/GameState';

export class RoomService {
  private rooms: Map<string, Room> = new Map();

  createRoom(roomId: string, roomName: string): Room {
    if (this.rooms.has(roomId)) {
      throw new Error(`Room with ID ${roomId} already exists`);
    }

    const room = createRoom(roomId, roomName);
    this.rooms.set(roomId, room);
    return room;
  }

  getRoom(roomId: string): Room | undefined {
    return this.rooms.get(roomId);
  }

  getAllRooms(): Room[] {
    return Array.from(this.rooms.values());
  }

  deleteRoom(roomId: string): boolean {
    return this.rooms.delete(roomId);
  }

  joinRoom(roomId: string, playerId: string, playerName: string): Room {
    const room = this.rooms.get(roomId);
    if (!room) {
      throw new Error(`Room ${roomId} not found`);
    }

    if (isRoomFull(room)) {
      throw new Error('Room is full');
    }

    let symbol: 'X' | 'O';
    if (room.players.length === 0) {
      // First player joining: use the game state's current turn
      // This respects the alternating starting player logic from previous games
      symbol = room.gameState.currentTurn;
    } else {
      // Second player gets the opposite symbol
      const existingPlayerSymbol = room.players[0].symbol;
      symbol = existingPlayerSymbol === 'X' ? 'O' : 'X';
    }
    
    console.log(`👤 Player ${playerId} (${playerName}) joining room ${roomId}. Assigned symbol: ${symbol}. Room has ${room.players.length} players. Current turn: ${room.gameState.currentTurn}`);
    
    const player = createPlayer(playerId, playerName, symbol);
    let updatedRoom = addPlayerToRoom(room, player);

    if (isRoomFull(updatedRoom)) {
      console.log(`🎮 Room ${roomId} is full, auto-starting game`);
      const updatedGameState = startGame(updatedRoom.gameState);
      updatedRoom = updateGameState(updatedRoom, updatedGameState);
      updatedRoom = updateRoomStatus(updatedRoom, 'playing');
      console.log(`🎮 Game started, room status: ${updatedRoom.status}, game status: ${updatedRoom.gameState.status}`);
    }

    this.rooms.set(roomId, updatedRoom);
    return updatedRoom;
  }

  leaveRoom(roomId: string, playerId: string): Room {
    const room = this.rooms.get(roomId);
    if (!room) {
      throw new Error(`Room ${roomId} not found`);
    }

    const leavingPlayer = room.players.find(p => p.id === playerId);
    console.log(`👋 Player ${playerId} leaving room ${roomId}. Player symbol: ${leavingPlayer?.symbol}`);

    const updatedRoom = removePlayerFromRoom(room, playerId);

    if (updatedRoom.players.length === 0) {
      this.rooms.delete(roomId);
      return updatedRoom;
    }

    const remainingPlayer = updatedRoom.players[0];
    console.log(`👤 Remaining player: ${remainingPlayer.id}, symbol: ${remainingPlayer.symbol}`);

    const resetRoom = {
      ...updatedRoom,
      status: 'waiting' as const,
      gameState: createInitialGameState(),
    };

    console.log(`🔄 Room reset. Game state currentTurn: ${resetRoom.gameState.currentTurn}`);

    this.rooms.set(roomId, resetRoom);
    return resetRoom;
  }

  setPlayerReady(roomId: string, playerId: string, ready: boolean): Room {
    const room = this.rooms.get(roomId);
    if (!room) {
      throw new Error(`Room ${roomId} not found`);
    }

    const player = room.players.find((p) => p.id === playerId);
    if (!player) {
      throw new Error(`Player ${playerId} not found in room`);
    }

    const updatedPlayer = setPlayerReady(player, ready);
    let updatedRoom = updatePlayerInRoom(room, updatedPlayer);

    if (areAllPlayersReady(updatedRoom) && isRoomFull(updatedRoom) && updatedRoom.status === 'waiting') {
      const updatedGameState = startGame(updatedRoom.gameState);
      updatedRoom = updateGameState(updatedRoom, updatedGameState);
      updatedRoom = updateRoomStatus(updatedRoom, 'playing');
    } else if (!areAllPlayersReady(updatedRoom) && updatedRoom.status === 'ready') {
      updatedRoom = updateRoomStatus(updatedRoom, 'waiting');
    }

    this.rooms.set(roomId, updatedRoom);
    return updatedRoom;
  }

  startGame(roomId: string): Room {
    const room = this.rooms.get(roomId);
    if (!room) {
      throw new Error(`Room ${roomId} not found`);
    }

    if (!areAllPlayersReady(room)) {
      throw new Error('Not all players are ready');
    }

    const updatedGameState = startGame(room.gameState);
    let updatedRoom = updateGameState(room, updatedGameState);
    updatedRoom = updateRoomStatus(updatedRoom, 'playing');

    this.rooms.set(roomId, updatedRoom);
    return updatedRoom;
  }

  makeMove(
    roomId: string,
    playerId: string,
    position: number
  ): Room {
    const room = this.rooms.get(roomId);
    if (!room) {
      throw new Error(`Room ${roomId} not found`);
    }

    console.log(`🎯 Move attempt in room ${roomId}: room.status=${room.status}, game.status=${room.gameState.status}`);
    
    if (room.status !== 'playing') {
      throw new Error('Game is not in progress');
    }

    const player = room.players.find((p) => p.id === playerId);
    if (!player) {
      throw new Error(`Player ${playerId} not found in room`);
    }

    if (room.gameState.currentTurn !== player.symbol) {
      throw new Error('Not your turn');
    }

    const updatedGameState = makeMove(
      room.gameState,
      position,
      player.symbol
    );

    let updatedRoom = updateGameState(room, updatedGameState);

    if (updatedGameState.status === 'finished') {
      updatedRoom = updateRoomStatus(updatedRoom, 'finished');
    }

    this.rooms.set(roomId, updatedRoom);
    return updatedRoom;
  }

  resetGame(roomId: string): Room {
    const room = this.rooms.get(roomId);
    if (!room) {
      throw new Error(`Room ${roomId} not found`);
    }

    const updatedGameState = resetGame(room.gameState); // Pass previous state to alternate starting player
    let updatedRoom = updateGameState(room, updatedGameState);

    // Swap player symbols to match the new starting player
    if (isRoomFull(updatedRoom) && updatedRoom.players.length === 2) {
      const [player1, player2] = updatedRoom.players;
      // If the new starting player symbol doesn't match the first player's symbol, swap them
      if (player1.symbol !== updatedGameState.currentTurn) {
        updatedRoom = {
          ...updatedRoom,
          players: [
            { ...player1, symbol: updatedGameState.currentTurn },
            { ...player2, symbol: updatedGameState.currentTurn === 'X' ? 'O' : 'X' }
          ]
        };
        console.log(`🔄 Swapped player symbols: ${player1.name} now has ${updatedGameState.currentTurn}, ${player2.name} has ${updatedGameState.currentTurn === 'X' ? 'O' : 'X'}`);
      }
    }

    if (isRoomFull(updatedRoom)) {
      console.log(`🔄 Resetting game in room ${roomId} with 2 players, auto-starting. New starting player: ${updatedGameState.currentTurn}`);
      const startedGameState = startGame(updatedGameState);
      updatedRoom = updateGameState(updatedRoom, startedGameState);
      updatedRoom = updateRoomStatus(updatedRoom, 'playing');
    } else {
      updatedRoom = updateRoomStatus(updatedRoom, 'waiting');
    }

    const resetPlayers = updatedRoom.players.map((p) =>
      setPlayerReady(p, false)
    );
    updatedRoom = { ...updatedRoom, players: resetPlayers };

    this.rooms.set(roomId, updatedRoom);
    return updatedRoom;
  }
}

export const roomService = new RoomService();
