import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { RoomService, Room, RoomListResponse, RoomResponse, DeleteRoomResponse } from './room.service';
import { environment } from '../../environments/environment';

describe('RoomService', () => {
  let service: RoomService;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.wsUrl}/api`;

  const mockRoom: Room = {
    id: 'ABC123',
    name: 'Test Room',
    status: 'waiting',
    players: [],
    gameState: {
      board: [null, null, null, null, null, null, null, null, null],
      currentTurn: 'X',
      status: 'waiting',
      winner: null,
      winningLine: null
    },
    createdAt: '2024-01-15T10:30:00.000Z'
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [RoomService]
    });
    service = TestBed.inject(RoomService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getRooms', () => {
    it('should fetch all rooms', (done) => {
      const mockResponse: RoomListResponse = {
        success: true,
        data: [mockRoom],
        count: 1
      };

      service.getRooms().subscribe(rooms => {
        expect(rooms).toEqual([mockRoom]);
        expect(rooms.length).toBe(1);
        done();
      });

      const req = httpMock.expectOne(`${apiUrl}/rooms`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should return empty array when no rooms exist', (done) => {
      const mockResponse: RoomListResponse = {
        success: true,
        data: [],
        count: 0
      };

      service.getRooms().subscribe(rooms => {
        expect(rooms).toEqual([]);
        expect(rooms.length).toBe(0);
        done();
      });

      const req = httpMock.expectOne(`${apiUrl}/rooms`);
      req.flush(mockResponse);
    });
  });

  describe('getRoom', () => {
    it('should fetch a specific room by ID', (done) => {
      const mockResponse: RoomResponse = {
        success: true,
        data: mockRoom
      };

      service.getRoom('ABC123').subscribe(room => {
        expect(room).toEqual(mockRoom);
        expect(room.id).toBe('ABC123');
        done();
      });

      const req = httpMock.expectOne(`${apiUrl}/rooms/ABC123`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('createRoom', () => {
    it('should create a new room', (done) => {
      const roomName = 'New Game Room';
      const mockResponse: RoomResponse = {
        success: true,
        data: { ...mockRoom, name: roomName }
      };

      service.createRoom(roomName).subscribe(room => {
        expect(room.name).toBe(roomName);
        expect(room.id).toBeTruthy();
        done();
      });

      const req = httpMock.expectOne(`${apiUrl}/rooms`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ roomName });
      req.flush(mockResponse);
    });
  });

  describe('deleteRoom', () => {
    it('should delete a room', (done) => {
      const mockResponse: DeleteRoomResponse = {
        success: true,
        message: 'Room deleted successfully'
      };

      service.deleteRoom('ABC123').subscribe(() => {
        done();
      });

      const req = httpMock.expectOne(`${apiUrl}/rooms/ABC123`);
      expect(req.request.method).toBe('DELETE');
      req.flush(mockResponse);
    });
  });

  describe('isRoomAvailable', () => {
    it('should return true for waiting rooms', () => {
      const room: Room = { ...mockRoom, status: 'waiting' };
      expect(service.isRoomAvailable(room)).toBe(true);
    });

    it('should return true for ready rooms', () => {
      const room: Room = { ...mockRoom, status: 'ready' };
      expect(service.isRoomAvailable(room)).toBe(true);
    });

    it('should return false for playing rooms', () => {
      const room: Room = { ...mockRoom, status: 'playing' };
      expect(service.isRoomAvailable(room)).toBe(false);
    });

    it('should return false for finished rooms', () => {
      const room: Room = { ...mockRoom, status: 'finished' };
      expect(service.isRoomAvailable(room)).toBe(false);
    });
  });

  describe('isRoomFull', () => {
    it('should return false for empty room', () => {
      const room: Room = { ...mockRoom, players: [] };
      expect(service.isRoomFull(room)).toBe(false);
    });

    it('should return false for room with one player', () => {
      const room: Room = {
        ...mockRoom,
        players: [{ id: 'p1', name: 'Player 1', symbol: 'X', isReady: false }]
      };
      expect(service.isRoomFull(room)).toBe(false);
    });

    it('should return true for room with two players', () => {
      const room: Room = {
        ...mockRoom,
        players: [
          { id: 'p1', name: 'Player 1', symbol: 'X', isReady: false },
          { id: 'p2', name: 'Player 2', symbol: 'O', isReady: false }
        ]
      };
      expect(service.isRoomFull(room)).toBe(true);
    });
  });

  describe('getAvailableSlots', () => {
    it('should return 2 for empty room', () => {
      const room: Room = { ...mockRoom, players: [] };
      expect(service.getAvailableSlots(room)).toBe(2);
    });

    it('should return 1 for room with one player', () => {
      const room: Room = {
        ...mockRoom,
        players: [{ id: 'p1', name: 'Player 1', symbol: 'X', isReady: false }]
      };
      expect(service.getAvailableSlots(room)).toBe(1);
    });

    it('should return 0 for full room', () => {
      const room: Room = {
        ...mockRoom,
        players: [
          { id: 'p1', name: 'Player 1', symbol: 'X', isReady: false },
          { id: 'p2', name: 'Player 2', symbol: 'O', isReady: false }
        ]
      };
      expect(service.getAvailableSlots(room)).toBe(0);
    });
  });
});
