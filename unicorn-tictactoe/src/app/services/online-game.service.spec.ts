import { TestBed } from '@angular/core/testing';
import { OnlineGameService, OnlineGameInfo } from './online-game.service';
import { WebSocketService, BackendGameState, BackendPlayer, RoomJoinedEvent, PlayerJoinedEvent, GameUpdateEvent, GameOverEvent, ErrorEvent } from './websocket.service';
import { Subject, BehaviorSubject } from 'rxjs';
import { GameState } from '../models/game-state.model';
import { Player } from '../models/player.model';
import { GameStatus } from '../models/game-status.enum';

describe('OnlineGameService', () => {
  let service: OnlineGameService;
  let mockWebSocketService: jasmine.SpyObj<WebSocketService>;
  
  // Mock subjects for WebSocket events
  let connectionStatusSubject: BehaviorSubject<boolean>;
  let roomJoinedSubject: Subject<RoomJoinedEvent>;
  let playerJoinedSubject: Subject<PlayerJoinedEvent>;
  let gameUpdateSubject: Subject<GameUpdateEvent>;
  let gameOverSubject: Subject<GameOverEvent>;
  let errorSubject: Subject<ErrorEvent>;

  beforeEach(() => {
    // Initialize mock subjects
    connectionStatusSubject = new BehaviorSubject<boolean>(false);
    roomJoinedSubject = new Subject<RoomJoinedEvent>();
    playerJoinedSubject = new Subject<PlayerJoinedEvent>();
    gameUpdateSubject = new Subject<GameUpdateEvent>();
    gameOverSubject = new Subject<GameOverEvent>();
    errorSubject = new Subject<ErrorEvent>();

    // Create mock WebSocketService
    mockWebSocketService = jasmine.createSpyObj('WebSocketService', [
      'connect',
      'disconnect',
      'joinRoom',
      'makeMove',
      'leaveRoom',
      'isConnected'
    ]);

    // Setup mock return values
    mockWebSocketService.getConnectionStatus = jasmine.createSpy('getConnectionStatus')
      .and.returnValue(connectionStatusSubject.asObservable());
    mockWebSocketService.onRoomJoined = jasmine.createSpy('onRoomJoined')
      .and.returnValue(roomJoinedSubject.asObservable());
    mockWebSocketService.onPlayerJoined = jasmine.createSpy('onPlayerJoined')
      .and.returnValue(playerJoinedSubject.asObservable());
    mockWebSocketService.onGameUpdate = jasmine.createSpy('onGameUpdate')
      .and.returnValue(gameUpdateSubject.asObservable());
    mockWebSocketService.onGameOver = jasmine.createSpy('onGameOver')
      .and.returnValue(gameOverSubject.asObservable());
    mockWebSocketService.onError = jasmine.createSpy('onError')
      .and.returnValue(errorSubject.asObservable());

    TestBed.configureTestingModule({
      providers: [
        OnlineGameService,
        { provide: WebSocketService, useValue: mockWebSocketService }
      ]
    });

    service = TestBed.inject(OnlineGameService);
  });

  afterEach(() => {
    // Clean up subjects
    connectionStatusSubject.complete();
    roomJoinedSubject.complete();
    playerJoinedSubject.complete();
    gameUpdateSubject.complete();
    gameOverSubject.complete();
    errorSubject.complete();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Connection Management', () => {
    it('should connect to WebSocket service', () => {
      service.connect();
      expect(mockWebSocketService.connect).toHaveBeenCalled();
    });

    it('should disconnect from WebSocket service', () => {
      service.disconnect();
      expect(mockWebSocketService.disconnect).toHaveBeenCalled();
    });

    it('should update connection status when WebSocket connects', (done) => {
      service.getConnectionStatus().subscribe(status => {
        if (status) {
          expect(status).toBe(true);
          done();
        }
      });

      connectionStatusSubject.next(true);
    });

    it('should reset state on disconnect', (done) => {
      // First set some state
      const mockPlayer: BackendPlayer = {
        id: 'player1',
        name: 'Test Player',
        symbol: 'X',
        isReady: true
      };

      const mockGameState: BackendGameState = {
        board: Array(9).fill(null),
        currentTurn: 'X',
        status: 'playing',
        winner: null,
        winningLine: null
      };

      roomJoinedSubject.next({
        roomId: 'room1',
        player: mockPlayer,
        gameState: mockGameState
      });

      // Wait a bit for state to update
      setTimeout(() => {
        service.disconnect();

        // Check state is null after disconnect
        const state = service.getCurrentGameState();
        const info = service.getCurrentOnlineGameInfo();
        
        expect(state).toBeNull();
        expect(info).toBeNull();
        done();
      }, 100);
    });
  });

  describe('Room Management', () => {
    it('should join a room successfully', () => {
      service.joinRoom('room123', 'Player1');
      expect(mockWebSocketService.joinRoom).toHaveBeenCalledWith('room123', 'Player1');
    });

    it('should handle room joined event', (done) => {
      const mockPlayer: BackendPlayer = {
        id: 'player1',
        name: 'Test Player',
        symbol: 'X',
        isReady: true
      };

      const mockGameState: BackendGameState = {
        board: Array(9).fill(null),
        currentTurn: 'X',
        status: 'playing',
        winner: null,
        winningLine: null
      };

      service.getOnlineGameInfo().subscribe(info => {
        if (info) {
          expect(info.roomId).toBe('room1');
          expect(info.currentPlayer).toEqual(mockPlayer);
          expect(info.opponent).toBeNull();
          expect(info.isMyTurn).toBe(true);
          done();
        }
      });

      roomJoinedSubject.next({
        roomId: 'room1',
        player: mockPlayer,
        gameState: mockGameState
      });
    });

    it('should handle player joined event', (done) => {
      const player1: BackendPlayer = {
        id: 'player1',
        name: 'Player 1',
        symbol: 'X',
        isReady: true
      };

      const player2: BackendPlayer = {
        id: 'player2',
        name: 'Player 2',
        symbol: 'O',
        isReady: true
      };

      const mockGameState: BackendGameState = {
        board: Array(9).fill(null),
        currentTurn: 'X',
        status: 'playing',
        winner: null,
        winningLine: null
      };

      // First join room
      roomJoinedSubject.next({
        roomId: 'room1',
        player: player1,
        gameState: mockGameState
      });

      // Then second player joins
      setTimeout(() => {
        service.getOnlineGameInfo().subscribe(info => {
          if (info && info.opponent) {
            expect(info.opponent).toEqual(player2);
            done();
          }
        });

        playerJoinedSubject.next({
          player: player2,
          gameState: mockGameState
        });
      }, 100);
    });

    it('should leave room successfully', (done) => {
      const mockPlayer: BackendPlayer = {
        id: 'player1',
        name: 'Test Player',
        symbol: 'X',
        isReady: true
      };

      const mockGameState: BackendGameState = {
        board: Array(9).fill(null),
        currentTurn: 'X',
        status: 'playing',
        winner: null,
        winningLine: null
      };

      roomJoinedSubject.next({
        roomId: 'room1',
        player: mockPlayer,
        gameState: mockGameState
      });

      setTimeout(() => {
        service.leaveRoom();
        expect(mockWebSocketService.leaveRoom).toHaveBeenCalledWith('room1');
        done();
      }, 100);
    });
  });

  describe('Game State Management', () => {
    it('should convert backend game state to frontend format', (done) => {
      const mockPlayer: BackendPlayer = {
        id: 'player1',
        name: 'Test Player',
        symbol: 'X',
        isReady: true
      };

      const mockGameState: BackendGameState = {
        board: ['X', 'O', null, 'X', null, null, null, null, null],
        currentTurn: 'O',
        status: 'playing',
        winner: null,
        winningLine: null
      };

      service.getGameState().subscribe(state => {
        if (state) {
          expect(state.board[0]).toBe(Player.UNICORN);
          expect(state.board[1]).toBe(Player.CAT);
          expect(state.board[2]).toBeNull();
          expect(state.currentPlayer).toBe(Player.CAT);
          expect(state.status).toBe(GameStatus.IN_PROGRESS);
          done();
        }
      });

      roomJoinedSubject.next({
        roomId: 'room1',
        player: mockPlayer,
        gameState: mockGameState
      });
    });

    it('should handle game update event', (done) => {
      const mockPlayer: BackendPlayer = {
        id: 'player1',
        name: 'Test Player',
        symbol: 'X',
        isReady: true
      };

      const initialGameState: BackendGameState = {
        board: Array(9).fill(null),
        currentTurn: 'X',
        status: 'playing',
        winner: null,
        winningLine: null
      };

      const updatedGameState: BackendGameState = {
        board: ['X', null, null, null, null, null, null, null, null],
        currentTurn: 'O',
        status: 'playing',
        winner: null,
        winningLine: null
      };

      roomJoinedSubject.next({
        roomId: 'room1',
        player: mockPlayer,
        gameState: initialGameState
      });

      setTimeout(() => {
        gameUpdateSubject.next({
          gameState: updatedGameState
        });

        setTimeout(() => {
          const state = service.getCurrentGameState();
          expect(state).not.toBeNull();
          expect(state?.board[0]).toBe(Player.UNICORN);
          expect(state?.currentPlayer).toBe(Player.CAT);
          done();
        }, 50);
      }, 100);
    });

    it('should handle game over event with winner', (done) => {
      const mockPlayer: BackendPlayer = {
        id: 'player1',
        name: 'Test Player',
        symbol: 'X',
        isReady: true
      };

      const initialGameState: BackendGameState = {
        board: Array(9).fill(null),
        currentTurn: 'X',
        status: 'playing',
        winner: null,
        winningLine: null
      };

      const gameOverState: BackendGameState = {
        board: ['X', 'X', 'X', 'O', 'O', null, null, null, null],
        currentTurn: 'X',
        status: 'finished',
        winner: 'X',
        winningLine: [0, 1, 2]
      };

      roomJoinedSubject.next({
        roomId: 'room1',
        player: mockPlayer,
        gameState: initialGameState
      });

      setTimeout(() => {
        service.getGameState().subscribe(state => {
          if (state && state.status === GameStatus.UNICORN_WINS) {
            expect(state.status).toBe(GameStatus.UNICORN_WINS);
            expect(state.winningLine).toEqual([0, 1, 2]);
            done();
          }
        });

        gameOverSubject.next({
          winner: mockPlayer,
          winningLine: [0, 1, 2],
          gameState: gameOverState
        });
      }, 100);
    });

    it('should handle game over event with draw', (done) => {
      const mockPlayer: BackendPlayer = {
        id: 'player1',
        name: 'Test Player',
        symbol: 'X',
        isReady: true
      };

      const initialGameState: BackendGameState = {
        board: Array(9).fill(null),
        currentTurn: 'X',
        status: 'playing',
        winner: null,
        winningLine: null
      };

      const gameOverState: BackendGameState = {
        board: ['X', 'O', 'X', 'X', 'O', 'O', 'O', 'X', 'X'],
        currentTurn: 'X',
        status: 'finished',
        winner: 'draw',
        winningLine: null
      };

      roomJoinedSubject.next({
        roomId: 'room1',
        player: mockPlayer,
        gameState: initialGameState
      });

      setTimeout(() => {
        service.getGameState().subscribe(state => {
          if (state && state.status === GameStatus.DRAW) {
            expect(state.status).toBe(GameStatus.DRAW);
            expect(state.winningLine).toBeNull();
            done();
          }
        });

        gameOverSubject.next({
          winner: null,
          winningLine: null,
          gameState: gameOverState
        });
      }, 100);
    });
  });

  describe('Move Management', () => {
    it('should make a valid move', (done) => {
      const mockPlayer: BackendPlayer = {
        id: 'player1',
        name: 'Test Player',
        symbol: 'X',
        isReady: true
      };

      const mockGameState: BackendGameState = {
        board: Array(9).fill(null),
        currentTurn: 'X',
        status: 'playing',
        winner: null,
        winningLine: null
      };

      roomJoinedSubject.next({
        roomId: 'room1',
        player: mockPlayer,
        gameState: mockGameState
      });

      setTimeout(() => {
        service.makeMove(0);
        expect(mockWebSocketService.makeMove).toHaveBeenCalledWith('room1', 0);
        done();
      }, 100);
    });

    it('should not allow move when not player turn', (done) => {
      const mockPlayer: BackendPlayer = {
        id: 'player1',
        name: 'Test Player',
        symbol: 'X',
        isReady: true
      };

      const mockGameState: BackendGameState = {
        board: Array(9).fill(null),
        currentTurn: 'O', // Not player's turn
        status: 'playing',
        winner: null,
        winningLine: null
      };

      roomJoinedSubject.next({
        roomId: 'room1',
        player: mockPlayer,
        gameState: mockGameState
      });

      setTimeout(() => {
        service.getErrorMessages().subscribe(error => {
          expect(error).toBe('Not your turn');
          done();
        });

        service.makeMove(0);
        expect(mockWebSocketService.makeMove).not.toHaveBeenCalled();
      }, 100);
    });

    it('should not allow move on occupied cell', (done) => {
      const mockPlayer: BackendPlayer = {
        id: 'player1',
        name: 'Test Player',
        symbol: 'X',
        isReady: true
      };

      const mockGameState: BackendGameState = {
        board: ['X', null, null, null, null, null, null, null, null],
        currentTurn: 'X',
        status: 'playing',
        winner: null,
        winningLine: null
      };

      roomJoinedSubject.next({
        roomId: 'room1',
        player: mockPlayer,
        gameState: mockGameState
      });

      setTimeout(() => {
        service.getErrorMessages().subscribe(error => {
          expect(error).toBe('Cell already occupied');
          done();
        });

        service.makeMove(0); // Cell 0 is already occupied
        expect(mockWebSocketService.makeMove).not.toHaveBeenCalled();
      }, 100);
    });

    it('should not allow move when no active game', (done) => {
      service.getErrorMessages().subscribe(error => {
        expect(error).toBe('No active game');
        done();
      });

      service.makeMove(0);
      expect(mockWebSocketService.makeMove).not.toHaveBeenCalled();
    });
  });

  describe('Turn Management', () => {
    it('should correctly identify player turn', (done) => {
      const mockPlayer: BackendPlayer = {
        id: 'player1',
        name: 'Test Player',
        symbol: 'X',
        isReady: true
      };

      const mockGameState: BackendGameState = {
        board: Array(9).fill(null),
        currentTurn: 'X',
        status: 'playing',
        winner: null,
        winningLine: null
      };

      service.getOnlineGameInfo().subscribe(info => {
        if (info) {
          expect(info.isMyTurn).toBe(true);
          done();
        }
      });

      roomJoinedSubject.next({
        roomId: 'room1',
        player: mockPlayer,
        gameState: mockGameState
      });
    });

    it('should update turn status after move', (done) => {
      const mockPlayer: BackendPlayer = {
        id: 'player1',
        name: 'Test Player',
        symbol: 'X',
        isReady: true
      };

      const initialGameState: BackendGameState = {
        board: Array(9).fill(null),
        currentTurn: 'X',
        status: 'playing',
        winner: null,
        winningLine: null
      };

      const updatedGameState: BackendGameState = {
        board: ['X', null, null, null, null, null, null, null, null],
        currentTurn: 'O',
        status: 'playing',
        winner: null,
        winningLine: null
      };

      roomJoinedSubject.next({
        roomId: 'room1',
        player: mockPlayer,
        gameState: initialGameState
      });

      setTimeout(() => {
        service.getOnlineGameInfo().subscribe(info => {
          if (info && !info.isMyTurn) {
            expect(info.isMyTurn).toBe(false);
            done();
          }
        });

        gameUpdateSubject.next({
          gameState: updatedGameState
        });
      }, 100);
    });
  });

  describe('Error Handling', () => {
    it('should handle WebSocket errors', (done) => {
      service.getErrorMessages().subscribe(error => {
        expect(error).toBe('Connection failed');
        done();
      });

      errorSubject.next({
        message: 'Connection failed'
      });
    });

    it('should handle join room errors', (done) => {
      mockWebSocketService.joinRoom.and.throwError('Connection error');

      service.getErrorMessages().subscribe(error => {
        expect(error).toContain('Failed to join room');
        done();
      });

      service.joinRoom('room1', 'Player1');
    });

    it('should handle make move errors', (done) => {
      const mockPlayer: BackendPlayer = {
        id: 'player1',
        name: 'Test Player',
        symbol: 'X',
        isReady: true
      };

      const mockGameState: BackendGameState = {
        board: Array(9).fill(null),
        currentTurn: 'X',
        status: 'playing',
        winner: null,
        winningLine: null
      };

      mockWebSocketService.makeMove.and.throwError('Network error');

      roomJoinedSubject.next({
        roomId: 'room1',
        player: mockPlayer,
        gameState: mockGameState
      });

      setTimeout(() => {
        service.getErrorMessages().subscribe(error => {
          expect(error).toContain('Failed to make move');
          done();
        });

        service.makeMove(0);
      }, 100);
    });
  });

  describe('State Getters', () => {
    it('should get current game state value', (done) => {
      const mockPlayer: BackendPlayer = {
        id: 'player1',
        name: 'Test Player',
        symbol: 'X',
        isReady: true
      };

      const mockGameState: BackendGameState = {
        board: Array(9).fill(null),
        currentTurn: 'X',
        status: 'playing',
        winner: null,
        winningLine: null
      };

      roomJoinedSubject.next({
        roomId: 'room1',
        player: mockPlayer,
        gameState: mockGameState
      });

      setTimeout(() => {
        const state = service.getCurrentGameState();
        expect(state).not.toBeNull();
        expect(state?.status).toBe(GameStatus.IN_PROGRESS);
        done();
      }, 100);
    });

    it('should get current online game info value', (done) => {
      const mockPlayer: BackendPlayer = {
        id: 'player1',
        name: 'Test Player',
        symbol: 'X',
        isReady: true
      };

      const mockGameState: BackendGameState = {
        board: Array(9).fill(null),
        currentTurn: 'X',
        status: 'playing',
        winner: null,
        winningLine: null
      };

      roomJoinedSubject.next({
        roomId: 'room1',
        player: mockPlayer,
        gameState: mockGameState
      });

      setTimeout(() => {
        const info = service.getCurrentOnlineGameInfo();
        expect(info).not.toBeNull();
        expect(info?.roomId).toBe('room1');
        done();
      }, 100);
    });

    it('should check connection status', (done) => {
      connectionStatusSubject.next(true);

      setTimeout(() => {
        expect(service.isConnected()).toBe(true);
        done();
      }, 100);
    });
  });
});
