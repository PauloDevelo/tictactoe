import { TestBed } from '@angular/core/testing';
import { 
  WebSocketService, 
  RoomJoinedEvent, 
  PlayerJoinedEvent, 
  GameUpdateEvent, 
  GameOverEvent, 
  ErrorEvent,
  BackendPlayer,
  BackendGameState
} from './websocket.service';
import { TranslationService } from './translation.service';

describe('WebSocketService', () => {
  let service: WebSocketService;
  let mockTranslationService: jasmine.SpyObj<TranslationService>;

  const createMockPlayer = (id: string, name: string, symbol: 'X' | 'O'): BackendPlayer => ({
    id,
    name,
    symbol,
    isReady: false
  });

  const createMockGameState = (status: 'waiting' | 'playing' | 'finished' = 'waiting'): BackendGameState => ({
    board: Array(9).fill(null),
    currentTurn: 'X',
    status,
    winner: null,
    winningLine: null
  });

  beforeEach(() => {
    // Create mock TranslationService
    mockTranslationService = jasmine.createSpyObj('TranslationService', ['translate']);
    mockTranslationService.translate.and.returnValue('errors.websocket.notConnected');

    TestBed.configureTestingModule({
      providers: [
        WebSocketService,
        { provide: TranslationService, useValue: mockTranslationService }
      ]
    });

    service = TestBed.inject(WebSocketService);
  });

  describe('Connection Management', () => {
    it('should create the service', () => {
      expect(service).toBeTruthy();
    });

    it('should return false for isConnected() initially', () => {
      expect(service.isConnected()).toBe(false);
    });

    it('should provide connection status observable', (done) => {
      service.getConnectionStatus().subscribe((status) => {
        expect(status).toBe(false);
        done();
      });
    });

    it('should handle disconnect when socket is null', () => {
      expect(() => service.disconnect()).not.toThrow();
    });
  });

  describe('Event Observables', () => {
    it('should provide roomJoined observable', (done) => {
      const mockData: RoomJoinedEvent = {
        roomId: 'room123',
        player: createMockPlayer('player1', 'Alice', 'X'),
        gameState: createMockGameState('waiting'),
        allPlayers: [createMockPlayer('player1', 'Alice', 'X')]
      };

      service.onRoomJoined().subscribe((data) => {
        expect(data).toEqual(mockData);
        done();
      });

      // Trigger the observable by calling the private subject
      (service as any).roomJoined$.next(mockData);
    });

    it('should provide playerJoined observable', (done) => {
      const mockData: PlayerJoinedEvent = {
        player: createMockPlayer('player2', 'Bob', 'O'),
        gameState: createMockGameState('playing')
      };

      service.onPlayerJoined().subscribe((data) => {
        expect(data).toEqual(mockData);
        done();
      });

      (service as any).playerJoined$.next(mockData);
    });

    it('should provide gameUpdate observable', (done) => {
      const mockData: GameUpdateEvent = {
        gameState: {
          board: ['X', null, null, null, null, null, null, null, null],
          currentTurn: 'O',
          status: 'playing',
          winner: null,
          winningLine: null
        }
      };

      service.onGameUpdate().subscribe((data) => {
        expect(data).toEqual(mockData);
        done();
      });

      (service as any).gameUpdate$.next(mockData);
    });

    it('should provide gameOver observable', (done) => {
      const mockData: GameOverEvent = {
        winner: createMockPlayer('player1', 'Alice', 'X'),
        winningLine: [0, 1, 2],
        gameState: {
          board: ['X', 'X', 'X', 'O', 'O', null, null, null, null],
          currentTurn: 'X',
          status: 'finished',
          winner: 'X',
          winningLine: [0, 1, 2]
        }
      };

      service.onGameOver().subscribe((data) => {
        expect(data).toEqual(mockData);
        done();
      });

      (service as any).gameOver$.next(mockData);
    });

    it('should provide error observable', (done) => {
      const mockData: ErrorEvent = {
        message: 'Invalid move'
      };

      service.onError().subscribe((data) => {
        expect(data).toEqual(mockData);
        done();
      });

      (service as any).error$.next(mockData);
    });
  });

  describe('Emit Actions - Error Handling', () => {
    it('should throw error when joining room without connection', () => {
      expect(() => {
        service.joinRoom('room123', 'Alice');
      }).toThrowError('errors.websocket.notConnected');
    });

    it('should throw error when making move without connection', () => {
      expect(() => {
        service.makeMove('room123', 4);
      }).toThrowError('errors.websocket.notConnected');
    });

    it('should throw error when leaving room without connection', () => {
      expect(() => {
        service.leaveRoom('room123');
      }).toThrowError('errors.websocket.notConnected');
    });
  });

  describe('Observable Streams', () => {
    it('should emit multiple events on the same observable', (done) => {
      const events: ErrorEvent[] = [];
      const expectedEvents: ErrorEvent[] = [
        { message: 'Error 1' },
        { message: 'Error 2' },
        { message: 'Error 3' }
      ];

      service.onError().subscribe((data) => {
        events.push(data);
        if (events.length === 3) {
          expect(events).toEqual(expectedEvents);
          done();
        }
      });

      expectedEvents.forEach(event => {
        (service as any).error$.next(event);
      });
    });

    it('should handle game state updates correctly', (done) => {
      const updates: GameUpdateEvent[] = [];
      
      service.onGameUpdate().subscribe((data) => {
        updates.push(data);
        if (updates.length === 2) {
          expect(updates[0].gameState.board[0]).toBe('X');
          expect(updates[1].gameState.board[1]).toBe('O');
          done();
        }
      });

      (service as any).gameUpdate$.next({
        gameState: {
          board: ['X', null, null, null, null, null, null, null, null],
          currentTurn: 'O',
          status: 'playing',
          winner: null,
          winningLine: null
        }
      });

      (service as any).gameUpdate$.next({
        gameState: {
          board: ['X', 'O', null, null, null, null, null, null, null],
          currentTurn: 'X',
          status: 'playing',
          winner: null,
          winningLine: null
        }
      });
    });
  });
});
