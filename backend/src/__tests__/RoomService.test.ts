import { RoomService } from '../services/RoomService';
import { Room } from '../models/Room';

describe('RoomService', () => {
  let roomService: RoomService;

  beforeEach(() => {
    roomService = new RoomService();
  });

  describe('createRoom', () => {
    it('should create a new room', () => {
      const room = roomService.createRoom('room1', 'Test Room');

      expect(room.id).toBe('room1');
      expect(room.name).toBe('Test Room');
      expect(room.players).toHaveLength(0);
      expect(room.status).toBe('waiting');
    });

    it('should throw error if room already exists', () => {
      roomService.createRoom('room1', 'Test Room');

      expect(() => {
        roomService.createRoom('room1', 'Another Room');
      }).toThrow('Room with ID room1 already exists');
    });
  });

  describe('getRoom', () => {
    it('should return room if exists', () => {
      roomService.createRoom('room1', 'Test Room');
      const room = roomService.getRoom('room1');

      expect(room).toBeDefined();
      expect(room?.id).toBe('room1');
    });

    it('should return undefined if room does not exist', () => {
      const room = roomService.getRoom('nonexistent');
      expect(room).toBeUndefined();
    });
  });

  describe('getAllRooms', () => {
    it('should return all rooms', () => {
      roomService.createRoom('room1', 'Room 1');
      roomService.createRoom('room2', 'Room 2');

      const rooms = roomService.getAllRooms();
      expect(rooms).toHaveLength(2);
    });

    it('should return empty array if no rooms', () => {
      const rooms = roomService.getAllRooms();
      expect(rooms).toHaveLength(0);
    });
  });

  describe('deleteRoom', () => {
    it('should delete room and return true', () => {
      roomService.createRoom('room1', 'Test Room');
      const result = roomService.deleteRoom('room1');

      expect(result).toBe(true);
      expect(roomService.getRoom('room1')).toBeUndefined();
    });

    it('should return false if room does not exist', () => {
      const result = roomService.deleteRoom('nonexistent');
      expect(result).toBe(false);
    });
  });

  describe('joinRoom', () => {
    beforeEach(() => {
      roomService.createRoom('room1', 'Test Room');
    });

    it('should add player to room with symbol X', () => {
      const room = roomService.joinRoom('room1', 'player1', 'Alice');

      expect(room.players).toHaveLength(1);
      expect(room.players[0].id).toBe('player1');
      expect(room.players[0].name).toBe('Alice');
      expect(room.players[0].symbol).toBe('X');
      expect(room.players[0].isReady).toBe(false);
    });

    it('should add second player with symbol O', () => {
      roomService.joinRoom('room1', 'player1', 'Alice');
      const room = roomService.joinRoom('room1', 'player2', 'Bob');

      expect(room.players).toHaveLength(2);
      expect(room.players[1].symbol).toBe('O');
    });

    it('should throw error if room is full', () => {
      roomService.joinRoom('room1', 'player1', 'Alice');
      roomService.joinRoom('room1', 'player2', 'Bob');

      expect(() => {
        roomService.joinRoom('room1', 'player3', 'Charlie');
      }).toThrow('Room is full');
    });

    it('should throw error if room does not exist', () => {
      expect(() => {
        roomService.joinRoom('nonexistent', 'player1', 'Alice');
      }).toThrow('Room nonexistent not found');
    });
  });

  describe('leaveRoom', () => {
    beforeEach(() => {
      roomService.createRoom('room1', 'Test Room');
      roomService.joinRoom('room1', 'player1', 'Alice');
    });

    it('should remove player from room', () => {
      const room = roomService.leaveRoom('room1', 'player1');

      expect(room.players).toHaveLength(0);
    });

    it('should delete room if last player leaves', () => {
      roomService.leaveRoom('room1', 'player1');

      expect(roomService.getRoom('room1')).toBeUndefined();
    });

    it('should reset game state when player leaves', () => {
      roomService.joinRoom('room1', 'player2', 'Bob');
      roomService.setPlayerReady('room1', 'player1', true);
      roomService.setPlayerReady('room1', 'player2', true);
      roomService.startGame('room1');

      const room = roomService.leaveRoom('room1', 'player2');

      expect(room.status).toBe('waiting');
      expect(room.gameState.status).toBe('waiting');
    });

    it('should throw error if room does not exist', () => {
      expect(() => {
        roomService.leaveRoom('nonexistent', 'player1');
      }).toThrow('Room nonexistent not found');
    });
  });

  describe('setPlayerReady', () => {
    beforeEach(() => {
      roomService.createRoom('room1', 'Test Room');
      roomService.joinRoom('room1', 'player1', 'Alice');
      roomService.joinRoom('room1', 'player2', 'Bob');
    });

    it('should set player ready status', () => {
      const room = roomService.setPlayerReady('room1', 'player1', true);

      expect(room.players[0].isReady).toBe(true);
    });

    it('should auto-start game when room is full (both players join)', () => {
      // Room auto-starts when full, regardless of ready status
      const room = roomService.getRoom('room1');

      expect(room).toBeDefined();
      expect(room?.status).toBe('playing');
      expect(room?.gameState.status).toBe('playing');
    });

    it('should maintain ready status when set manually', () => {
      // Even though game is auto-started, ready status can still be set
      roomService.setPlayerReady('room1', 'player1', true);
      const room = roomService.setPlayerReady('room1', 'player2', true);

      expect(room.players[0].isReady).toBe(true);
      expect(room.players[1].isReady).toBe(true);
    });

    it('should throw error if player not found', () => {
      expect(() => {
        roomService.setPlayerReady('room1', 'nonexistent', true);
      }).toThrow('Player nonexistent not found in room');
    });
  });

  describe('startGame', () => {
    beforeEach(() => {
      roomService.createRoom('room1', 'Test Room');
      roomService.joinRoom('room1', 'player1', 'Alice');
      roomService.joinRoom('room1', 'player2', 'Bob');
    });

    it('should start game when all players ready', () => {
      roomService.setPlayerReady('room1', 'player1', true);
      roomService.setPlayerReady('room1', 'player2', true);

      const room = roomService.startGame('room1');

      expect(room.status).toBe('playing');
      expect(room.gameState.status).toBe('playing');
    });

    it('should throw error if not all players ready', () => {
      roomService.setPlayerReady('room1', 'player1', true);

      expect(() => {
        roomService.startGame('room1');
      }).toThrow('Not all players are ready');
    });
  });

  describe('makeMove', () => {
    beforeEach(() => {
      roomService.createRoom('room1', 'Test Room');
      roomService.joinRoom('room1', 'player1', 'Alice');
      roomService.joinRoom('room1', 'player2', 'Bob');
      roomService.setPlayerReady('room1', 'player1', true);
      roomService.setPlayerReady('room1', 'player2', true);
      roomService.startGame('room1');
    });

    it('should make a valid move', () => {
      const room = roomService.makeMove('room1', 'player1', 0);

      expect(room.gameState.board[0]).toBe('X');
      expect(room.gameState.currentTurn).toBe('O');
    });

    it('should throw error if not player turn', () => {
      expect(() => {
        roomService.makeMove('room1', 'player2', 0);
      }).toThrow('Not your turn');
    });

    it('should allow moves after reset (game auto-restarts)', () => {
      // After reset, game auto-starts again since room is full
      const resetRoom = roomService.resetGame('room1');
      
      expect(resetRoom.status).toBe('playing');
      expect(resetRoom.gameState.status).toBe('playing');
      
      // Starting player should alternate: Game 1 was X, Game 2 should be O
      expect(resetRoom.gameState.currentTurn).toBe('O');
      
      // Player2 (O) should be able to make the first move after reset
      const room = roomService.makeMove('room1', 'player2', 0);
      expect(room.gameState.board[0]).toBe('O');
      expect(room.gameState.currentTurn).toBe('X');
    });

    it('should set room status to finished when game ends', () => {
      // Create winning scenario for X
      roomService.makeMove('room1', 'player1', 0); // X
      roomService.makeMove('room1', 'player2', 3); // O
      roomService.makeMove('room1', 'player1', 1); // X
      roomService.makeMove('room1', 'player2', 4); // O
      const room = roomService.makeMove('room1', 'player1', 2); // X wins

      expect(room.status).toBe('finished');
      expect(room.gameState.winner).toBe('X');
    });
  });

  describe('resetGame', () => {
    beforeEach(() => {
      roomService.createRoom('room1', 'Test Room');
      roomService.joinRoom('room1', 'player1', 'Alice');
      roomService.joinRoom('room1', 'player2', 'Bob');
      roomService.setPlayerReady('room1', 'player1', true);
      roomService.setPlayerReady('room1', 'player2', true);
      roomService.startGame('room1');
      roomService.makeMove('room1', 'player1', 0);
    });

    it('should reset game state and auto-restart when room is full', () => {
      const room = roomService.resetGame('room1');

      expect(room.gameState.board.every((cell) => cell === null)).toBe(true);
      // Game auto-starts since room still has 2 players
      expect(room.gameState.status).toBe('playing');
      expect(room.status).toBe('playing');
    });

    it('should reset all players ready status', () => {
      const room = roomService.resetGame('room1');

      expect(room.players.every((p) => !p.isReady)).toBe(true);
    });

    it('should alternate starting player across multiple resets', () => {
      // First game starts with X (player1), after one move it's O's turn
      const room1 = roomService.getRoom('room1');
      expect(room1?.gameState.currentTurn).toBe('O'); // After X's move, it's O's turn
      expect(room1?.gameState.lastStartingPlayer).toBe('X'); // X started this game

      // Reset - second game should start with O (player2)
      const room2 = roomService.resetGame('room1');
      expect(room2.gameState.currentTurn).toBe('O');
      expect(room2.gameState.lastStartingPlayer).toBe('O');

      // Reset again - third game should start with X (player1)
      const room3 = roomService.resetGame('room1');
      expect(room3.gameState.currentTurn).toBe('X');
      expect(room3.gameState.lastStartingPlayer).toBe('X');

      // Reset again - fourth game should start with O (player2)
      const room4 = roomService.resetGame('room1');
      expect(room4.gameState.currentTurn).toBe('O');
      expect(room4.gameState.lastStartingPlayer).toBe('O');
    });
  });
});
