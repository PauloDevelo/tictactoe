import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { JoinRoomModalComponent } from './join-room-modal.component';
import { Room } from '../../models/room.interface';
import { RoomStatus } from '../../models/room-status.enum';
import { GameStatus } from '../../models/game-status.enum';
import { Player } from '../../models/player.model';

describe('JoinRoomModalComponent', () => {
  let component: JoinRoomModalComponent;
  let fixture: ComponentFixture<JoinRoomModalComponent>;

  const mockRoom: Room = {
    id: 'ABC123',
    name: 'Test Room',
    players: [
      {
        id: 'player1',
        name: 'Alice',
        symbol: Player.UNICORN,
        isReady: true
      }
    ],
    maxPlayers: 2,
    gameState: {
      board: [null, null, null, null, null, null, null, null, null],
      currentPlayer: Player.UNICORN,
      status: GameStatus.IN_PROGRESS,
      scores: {
        unicorn: 0,
        cat: 0
      },
      winningLine: null
    },
    status: RoomStatus.WAITING,
    createdAt: new Date('2024-01-15T10:30:00.000Z')
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JoinRoomModalComponent, FormsModule]
    }).compileComponents();

    fixture = TestBed.createComponent(JoinRoomModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Component Initialization', () => {
    it('should initialize with default values', () => {
      expect(component.room).toBeNull();
      expect(component.isVisible).toBe(false);
      expect(component.playerName).toBe('');
      expect(component.isJoining).toBe(false);
    });
  });

  describe('isRoomFull', () => {
    it('should return false when room is null', () => {
      component.room = null;
      expect(component.isRoomFull()).toBe(false);
    });

    it('should return false when room has available slots', () => {
      component.room = mockRoom;
      expect(component.isRoomFull()).toBe(false);
    });

    it('should return true when room is full', () => {
      const fullRoom: Room = {
        ...mockRoom,
        players: [
          { id: 'player1', name: 'Alice', symbol: Player.UNICORN, isReady: true },
          { id: 'player2', name: 'Bob', symbol: Player.CAT, isReady: true }
        ]
      };
      component.room = fullRoom;
      expect(component.isRoomFull()).toBe(true);
    });
  });

  describe('canJoin', () => {
    beforeEach(() => {
      component.room = mockRoom;
      component.isJoining = false;
    });

    it('should return false when room is null', () => {
      component.room = null;
      component.playerName = 'ValidName';
      expect(component.canJoin()).toBe(false);
    });

    it('should return false when player name is empty', () => {
      component.playerName = '';
      expect(component.canJoin()).toBe(false);
    });

    it('should return false when player name is too short', () => {
      component.playerName = 'A';
      expect(component.canJoin()).toBe(false);
    });

    it('should return false when player name is too long', () => {
      component.playerName = 'A'.repeat(21);
      expect(component.canJoin()).toBe(false);
    });

    it('should return false when room is full', () => {
      const fullRoom: Room = {
        ...mockRoom,
        players: [
          { id: 'player1', name: 'Alice', symbol: Player.UNICORN, isReady: true },
          { id: 'player2', name: 'Bob', symbol: Player.CAT, isReady: true }
        ]
      };
      component.room = fullRoom;
      component.playerName = 'ValidName';
      expect(component.canJoin()).toBe(false);
    });

    it('should return false when already joining', () => {
      component.playerName = 'ValidName';
      component.isJoining = true;
      expect(component.canJoin()).toBe(false);
    });

    it('should return true when all conditions are met', () => {
      component.playerName = 'ValidName';
      expect(component.canJoin()).toBe(true);
    });

    it('should trim whitespace when checking player name', () => {
      component.playerName = '  ValidName  ';
      expect(component.canJoin()).toBe(true);
    });
  });

  describe('onJoin', () => {
    beforeEach(() => {
      component.room = mockRoom;
      component.playerName = 'ValidName';
      component.isJoining = false;
    });

    it('should emit joinRequested event with correct data', () => {
      spyOn(component.joinRequested, 'emit');
      
      component.onJoin();

      expect(component.joinRequested.emit).toHaveBeenCalledWith({
        roomId: 'ABC123',
        playerName: 'ValidName'
      });
    });

    it('should set isJoining to true', () => {
      component.onJoin();
      expect(component.isJoining).toBe(true);
    });

    it('should trim player name before emitting', () => {
      spyOn(component.joinRequested, 'emit');
      component.playerName = '  ValidName  ';
      
      component.onJoin();

      expect(component.joinRequested.emit).toHaveBeenCalledWith({
        roomId: 'ABC123',
        playerName: 'ValidName'
      });
    });

    it('should not emit when canJoin returns false', () => {
      spyOn(component.joinRequested, 'emit');
      component.playerName = '';
      
      component.onJoin();

      expect(component.joinRequested.emit).not.toHaveBeenCalled();
    });
  });

  describe('onClose', () => {
    it('should emit closeRequested event', () => {
      spyOn(component.closeRequested, 'emit');
      
      component.onClose();

      expect(component.closeRequested.emit).toHaveBeenCalled();
    });

    it('should reset player name', () => {
      component.playerName = 'TestName';
      
      component.onClose();

      expect(component.playerName).toBe('');
    });

    it('should reset isJoining flag', () => {
      component.isJoining = true;
      
      component.onClose();

      expect(component.isJoining).toBe(false);
    });
  });

  describe('onBackdropClick', () => {
    it('should call onClose when clicking on backdrop', () => {
      spyOn(component, 'onClose');
      const event = new MouseEvent('click');
      Object.defineProperty(event, 'target', { value: event.currentTarget, writable: false });
      
      component.onBackdropClick(event);

      expect(component.onClose).toHaveBeenCalled();
    });

    it('should not call onClose when clicking on modal content', () => {
      spyOn(component, 'onClose');
      const backdrop = document.createElement('div');
      const modal = document.createElement('div');
      backdrop.appendChild(modal);
      
      const event = new MouseEvent('click');
      Object.defineProperty(event, 'target', { value: modal, writable: false });
      Object.defineProperty(event, 'currentTarget', { value: backdrop, writable: false });
      
      component.onBackdropClick(event);

      expect(component.onClose).not.toHaveBeenCalled();
    });
  });

  describe('getRoomStatusText', () => {
    it('should return empty string when room is null', () => {
      component.room = null;
      expect(component.getRoomStatusText()).toBe('');
    });

    it('should return correct text for WAITING status', () => {
      component.room = { ...mockRoom, status: RoomStatus.WAITING };
      expect(component.getRoomStatusText()).toBe('Waiting for players');
    });

    it('should return correct text for READY status', () => {
      component.room = { ...mockRoom, status: RoomStatus.READY };
      expect(component.getRoomStatusText()).toBe('Ready to start');
    });

    it('should return correct text for IN_PROGRESS status', () => {
      component.room = { ...mockRoom, status: RoomStatus.IN_PROGRESS };
      expect(component.getRoomStatusText()).toBe('Game in progress');
    });

    it('should return correct text for FINISHED status', () => {
      component.room = { ...mockRoom, status: RoomStatus.FINISHED };
      expect(component.getRoomStatusText()).toBe('Game finished');
    });
  });

  describe('handleEscapeKey', () => {
    it('should call onClose when escape is pressed and modal is visible', () => {
      spyOn(component, 'onClose');
      component.isVisible = true;
      component.isJoining = false;
      
      component.handleEscapeKey();

      expect(component.onClose).toHaveBeenCalled();
    });

    it('should not call onClose when modal is not visible', () => {
      spyOn(component, 'onClose');
      component.isVisible = false;
      
      component.handleEscapeKey();

      expect(component.onClose).not.toHaveBeenCalled();
    });

    it('should not call onClose when joining is in progress', () => {
      spyOn(component, 'onClose');
      component.isVisible = true;
      component.isJoining = true;
      
      component.handleEscapeKey();

      expect(component.onClose).not.toHaveBeenCalled();
    });
  });
});
