import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RoomDetailsComponent } from './room-details.component';
import { Room } from '../../services/room.service';

describe('RoomDetailsComponent', () => {
  let component: RoomDetailsComponent;
  let fixture: ComponentFixture<RoomDetailsComponent>;

  const mockRoom: Room = {
    id: 'ABC123',
    name: 'Test Room',
    status: 'waiting',
    players: [
      { id: 'p1', name: 'Player 1', symbol: 'X', isReady: true }
    ],
    gameState: {
      board: [null, null, null, null, null, null, null, null, null],
      currentTurn: 'X',
      status: 'waiting',
      winner: null,
      winningLine: null
    },
    createdAt: '2024-01-15T10:30:00.000Z'
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RoomDetailsComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(RoomDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('copyRoomId', () => {
    it('should copy room ID to clipboard', async () => {
      component.room = mockRoom;
      spyOn(navigator.clipboard, 'writeText').and.returnValue(Promise.resolve());

      await component.copyRoomId();

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('ABC123');
    });

    it('should show copied message temporarily', (done) => {
      component.room = mockRoom;
      spyOn(navigator.clipboard, 'writeText').and.returnValue(Promise.resolve());

      component.copyRoomId();

      setTimeout(() => {
        expect(component.showCopiedMessage).toBe(true);
        setTimeout(() => {
          expect(component.showCopiedMessage).toBe(false);
          done();
        }, 2100);
      }, 100);
    });

    it('should handle clipboard error', (done) => {
      component.room = mockRoom;
      const consoleErrorSpy = spyOn(console, 'error');
      spyOn(navigator.clipboard, 'writeText').and.returnValue(Promise.reject('Error'));

      component.copyRoomId();

      // Wait for the promise to settle and error to be logged
      setTimeout(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to copy room ID:', 'Error');
        done();
      }, 100);
    });

    it('should do nothing if room is null', () => {
      component.room = null;
      spyOn(navigator.clipboard, 'writeText');

      component.copyRoomId();

      expect(navigator.clipboard.writeText).not.toHaveBeenCalled();
    });
  });

  describe('onJoinRoom', () => {
    it('should emit joinRoom event with room ID', () => {
      component.room = mockRoom;
      spyOn(component.joinRoom, 'emit');

      component.onJoinRoom();

      expect(component.joinRoom.emit).toHaveBeenCalledWith('ABC123');
    });

    it('should not emit if room is null', () => {
      component.room = null;
      spyOn(component.joinRoom, 'emit');

      component.onJoinRoom();

      expect(component.joinRoom.emit).not.toHaveBeenCalled();
    });
  });

  describe('onDeleteRoom', () => {
    it('should emit deleteRoom event when confirmed', () => {
      component.room = mockRoom;
      spyOn(window, 'confirm').and.returnValue(true);
      spyOn(component.deleteRoom, 'emit');

      component.onDeleteRoom();

      expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete room "Test Room"?');
      expect(component.deleteRoom.emit).toHaveBeenCalledWith('ABC123');
    });

    it('should not emit deleteRoom event when cancelled', () => {
      component.room = mockRoom;
      spyOn(window, 'confirm').and.returnValue(false);
      spyOn(component.deleteRoom, 'emit');

      component.onDeleteRoom();

      expect(component.deleteRoom.emit).not.toHaveBeenCalled();
    });

    it('should not emit if room is null', () => {
      component.room = null;
      spyOn(window, 'confirm');
      spyOn(component.deleteRoom, 'emit');

      component.onDeleteRoom();

      expect(window.confirm).not.toHaveBeenCalled();
      expect(component.deleteRoom.emit).not.toHaveBeenCalled();
    });
  });

  describe('onClose', () => {
    it('should emit close event', () => {
      spyOn(component.close, 'emit');

      component.onClose();

      expect(component.close.emit).toHaveBeenCalled();
    });
  });

  describe('getStatusClass', () => {
    it('should return correct class for each status', () => {
      expect(component.getStatusClass('waiting')).toBe('status-waiting');
      expect(component.getStatusClass('ready')).toBe('status-ready');
      expect(component.getStatusClass('playing')).toBe('status-playing');
      expect(component.getStatusClass('finished')).toBe('status-finished');
      expect(component.getStatusClass('unknown')).toBe('');
    });
  });

  describe('canJoinRoom', () => {
    it('should return true for waiting room with space', () => {
      component.room = { ...mockRoom, status: 'waiting', players: [] };
      expect(component.canJoinRoom()).toBe(true);
    });

    it('should return true for ready room with space', () => {
      component.room = { ...mockRoom, status: 'ready', players: [mockRoom.players[0]] };
      expect(component.canJoinRoom()).toBe(true);
    });

    it('should return false for full room', () => {
      component.room = {
        ...mockRoom,
        status: 'waiting',
        players: [
          { id: 'p1', name: 'Player 1', symbol: 'X', isReady: true },
          { id: 'p2', name: 'Player 2', symbol: 'O', isReady: true }
        ]
      };
      expect(component.canJoinRoom()).toBe(false);
    });

    it('should return false for playing room', () => {
      component.room = { ...mockRoom, status: 'playing' };
      expect(component.canJoinRoom()).toBe(false);
    });

    it('should return false for finished room', () => {
      component.room = { ...mockRoom, status: 'finished' };
      expect(component.canJoinRoom()).toBe(false);
    });

    it('should return false if room is null', () => {
      component.room = null;
      expect(component.canJoinRoom()).toBe(false);
    });
  });

  describe('canDeleteRoom', () => {
    it('should return true for waiting room', () => {
      component.room = { ...mockRoom, status: 'waiting' };
      expect(component.canDeleteRoom()).toBe(true);
    });

    it('should return true for finished room', () => {
      component.room = { ...mockRoom, status: 'finished' };
      expect(component.canDeleteRoom()).toBe(true);
    });

    it('should return false for ready room', () => {
      component.room = { ...mockRoom, status: 'ready' };
      expect(component.canDeleteRoom()).toBe(false);
    });

    it('should return false for playing room', () => {
      component.room = { ...mockRoom, status: 'playing' };
      expect(component.canDeleteRoom()).toBe(false);
    });

    it('should return false if room is null', () => {
      component.room = null;
      expect(component.canDeleteRoom()).toBe(false);
    });
  });

  describe('getFormattedDate', () => {
    it('should format date string', () => {
      const formatted = component.getFormattedDate('2024-01-15T10:30:00.000Z');
      expect(formatted).toBeTruthy();
      expect(typeof formatted).toBe('string');
    });
  });

  describe('getWinnerText', () => {
    it('should return N/A if no winner', () => {
      component.room = mockRoom;
      expect(component.getWinnerText()).toBe('N/A');
    });

    it('should return Draw for draw game', () => {
      component.room = {
        ...mockRoom,
        gameState: { ...mockRoom.gameState, winner: 'draw' }
      };
      expect(component.getWinnerText()).toBe('Draw');
    });

    it('should return player name and symbol for winner', () => {
      component.room = {
        ...mockRoom,
        gameState: { ...mockRoom.gameState, winner: 'X' }
      };
      expect(component.getWinnerText()).toBe('Player 1 (X)');
    });

    it('should return symbol if player not found', () => {
      component.room = {
        ...mockRoom,
        players: [],
        gameState: { ...mockRoom.gameState, winner: 'X' }
      };
      expect(component.getWinnerText()).toBe('X');
    });

    it('should return N/A if room is null', () => {
      component.room = null;
      expect(component.getWinnerText()).toBe('N/A');
    });
  });

  describe('ngOnChanges', () => {
    it('should reset showCopiedMessage when room changes', () => {
      component.showCopiedMessage = true;
      
      component.ngOnChanges({
        room: {
          currentValue: mockRoom,
          previousValue: null,
          firstChange: true,
          isFirstChange: () => true
        }
      });

      expect(component.showCopiedMessage).toBe(false);
    });
  });
});
