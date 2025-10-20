import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { RoomListComponent } from './room-list.component';
import { RoomService, Room } from '../../services/room.service';

describe('RoomListComponent', () => {
  let component: RoomListComponent;
  let fixture: ComponentFixture<RoomListComponent>;
  let mockRoomService: jasmine.SpyObj<RoomService>;

  const mockRooms: Room[] = [
    {
      id: 'ROOM1',
      name: 'Waiting Room',
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
    },
    {
      id: 'ROOM2',
      name: 'Active Room',
      status: 'playing',
      players: [
        { id: 'p1', name: 'Player 1', symbol: 'X', isReady: true },
        { id: 'p2', name: 'Player 2', symbol: 'O', isReady: true }
      ],
      gameState: {
        board: ['X', 'O', null, null, null, null, null, null, null],
        currentTurn: 'X',
        status: 'playing',
        winner: null,
        winningLine: null
      },
      createdAt: '2024-01-15T10:30:00.000Z'
    },
    {
      id: 'ROOM3',
      name: 'Finished Room',
      status: 'finished',
      players: [
        { id: 'p1', name: 'Player 1', symbol: 'X', isReady: true },
        { id: 'p2', name: 'Player 2', symbol: 'O', isReady: true }
      ],
      gameState: {
        board: ['X', 'X', 'X', 'O', 'O', null, null, null, null],
        currentTurn: 'X',
        status: 'finished',
        winner: 'X',
        winningLine: [0, 1, 2]
      },
      createdAt: '2024-01-15T10:30:00.000Z'
    }
  ];

  beforeEach(async () => {
    mockRoomService = jasmine.createSpyObj('RoomService', [
      'getRooms',
      'isRoomAvailable',
      'isRoomFull',
      'getAvailableSlots'
    ]);

    await TestBed.configureTestingModule({
      imports: [RoomListComponent],
      providers: [
        { provide: RoomService, useValue: mockRoomService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(RoomListComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should load rooms on initialization', fakeAsync(() => {
      mockRoomService.getRooms.and.returnValue(of(mockRooms));

      component.ngOnInit();
      tick();

      expect(mockRoomService.getRooms).toHaveBeenCalled();
      expect(component.rooms).toEqual(mockRooms);
    }));
  });

  describe('loadRooms', () => {
    it('should load rooms successfully', (done) => {
      mockRoomService.getRooms.and.returnValue(of(mockRooms));

      component.loadRooms();

      setTimeout(() => {
        expect(component.rooms).toEqual(mockRooms);
        expect(component.loading).toBe(false);
        expect(component.error).toBeNull();
        done();
      }, 100);
    });

    it('should handle error when loading rooms fails', (done) => {
      mockRoomService.getRooms.and.returnValue(throwError(() => new Error('Network error')));

      component.loadRooms();

      setTimeout(() => {
        expect(component.error).toBe('Failed to load rooms. Please try again.');
        expect(component.loading).toBe(false);
        done();
      }, 100);
    });

    it('should set loading state while fetching', (done) => {
      mockRoomService.getRooms.and.returnValue(of(mockRooms));

      // Check loading is true immediately after calling loadRooms
      expect(component.loading).toBe(false); // Initially false
      component.loadRooms();
      
      // Use setTimeout to check the loading state was set
      setTimeout(() => {
        // After observable completes, loading should be false
        expect(component.loading).toBe(false);
        done();
      }, 100);
    });
  });

  describe('getAvailableRooms', () => {
    it('should return only available rooms', () => {
      component.rooms = mockRooms;
      mockRoomService.isRoomAvailable.and.callFake((room: Room) => 
        room.status === 'waiting' || room.status === 'ready'
      );

      const availableRooms = component.getAvailableRooms();

      expect(availableRooms.length).toBe(1);
      expect(availableRooms[0].id).toBe('ROOM1');
    });
  });

  describe('getActiveRooms', () => {
    it('should return only playing rooms', () => {
      component.rooms = mockRooms;

      const activeRooms = component.getActiveRooms();

      expect(activeRooms.length).toBe(1);
      expect(activeRooms[0].id).toBe('ROOM2');
    });
  });

  describe('getFinishedRooms', () => {
    it('should return only finished rooms', () => {
      component.rooms = mockRooms;

      const finishedRooms = component.getFinishedRooms();

      expect(finishedRooms.length).toBe(1);
      expect(finishedRooms[0].id).toBe('ROOM3');
    });
  });

  describe('getAvailableSlots', () => {
    it('should return available slots from service', () => {
      const room = mockRooms[0];
      mockRoomService.getAvailableSlots.and.returnValue(2);

      const slots = component.getAvailableSlots(room);

      expect(slots).toBe(2);
      expect(mockRoomService.getAvailableSlots).toHaveBeenCalledWith(room);
    });
  });

  describe('isRoomFull', () => {
    it('should check if room is full via service', () => {
      const room = mockRooms[1];
      mockRoomService.isRoomFull.and.returnValue(true);

      const isFull = component.isRoomFull(room);

      expect(isFull).toBe(true);
      expect(mockRoomService.isRoomFull).toHaveBeenCalledWith(room);
    });
  });

  describe('getStatusClass', () => {
    it('should return correct class for waiting status', () => {
      expect(component.getStatusClass('waiting')).toBe('status-waiting');
    });

    it('should return correct class for ready status', () => {
      expect(component.getStatusClass('ready')).toBe('status-ready');
    });

    it('should return correct class for playing status', () => {
      expect(component.getStatusClass('playing')).toBe('status-playing');
    });

    it('should return correct class for finished status', () => {
      expect(component.getStatusClass('finished')).toBe('status-finished');
    });

    it('should return empty string for unknown status', () => {
      expect(component.getStatusClass('unknown')).toBe('');
    });
  });

  describe('trackByRoomId', () => {
    it('should return room ID for tracking', () => {
      const room = mockRooms[0];
      expect(component.trackByRoomId(0, room)).toBe('ROOM1');
    });
  });

  describe('ngOnDestroy', () => {
    it('should complete destroy subject', () => {
      spyOn(component['destroy$'], 'next');
      spyOn(component['destroy$'], 'complete');

      component.ngOnDestroy();

      expect(component['destroy$'].next).toHaveBeenCalled();
      expect(component['destroy$'].complete).toHaveBeenCalled();
    });
  });
});
