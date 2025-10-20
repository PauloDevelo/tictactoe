import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { CreateRoomComponent } from './create-room.component';
import { RoomService, Room } from '../../services/room.service';
import { TranslationService } from '../../services/translation.service';

describe('CreateRoomComponent', () => {
  let component: CreateRoomComponent;
  let fixture: ComponentFixture<CreateRoomComponent>;
  let mockRoomService: jasmine.SpyObj<RoomService>;
  let mockTranslationService: jasmine.SpyObj<TranslationService>;

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

  beforeEach(async () => {
    mockRoomService = jasmine.createSpyObj('RoomService', ['createRoom']);
    mockTranslationService = jasmine.createSpyObj('TranslationService', ['translate']);
    mockTranslationService.translate.and.callFake((key: string) => key);

    await TestBed.configureTestingModule({
      imports: [CreateRoomComponent, FormsModule],
      providers: [
        { provide: RoomService, useValue: mockRoomService },
        { provide: TranslationService, useValue: mockTranslationService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CreateRoomComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('createRoom', () => {
    it('should create room successfully with valid name and player name', (done) => {
      component.roomName = 'Valid Room Name';
      component.playerName = 'Alice';
      mockRoomService.createRoom.and.returnValue(of(mockRoom));

      spyOn(component.roomCreated, 'emit');

      component.createRoom();

      setTimeout(() => {
        expect(mockRoomService.createRoom).toHaveBeenCalledWith('Valid Room Name');
        expect(component.roomCreated.emit).toHaveBeenCalledWith({ room: mockRoom, playerName: 'Alice' });
        expect(component.roomName).toBe('');
        expect(component.playerName).toBe('');
        expect(component.creating).toBe(false);
        expect(component.error).toBeNull();
        done();
      }, 100);
    });

    it('should trim whitespace from room name and player name', (done) => {
      component.roomName = '  Valid Room Name  ';
      component.playerName = '  Alice  ';
      mockRoomService.createRoom.and.returnValue(of(mockRoom));

      spyOn(component.roomCreated, 'emit');

      component.createRoom();

      setTimeout(() => {
        expect(mockRoomService.createRoom).toHaveBeenCalledWith('Valid Room Name');
        expect(component.roomCreated.emit).toHaveBeenCalledWith({ room: mockRoom, playerName: 'Alice' });
        done();
      }, 100);
    });

    it('should show error for empty room name', () => {
      component.roomName = '';
      component.playerName = 'Alice';
      component.createRoom();

      expect(component.error).toBe('room.create.errors.roomNameRequired');
      expect(mockRoomService.createRoom).not.toHaveBeenCalled();
    });

    it('should show error for whitespace-only room name', () => {
      component.roomName = '   ';
      component.playerName = 'Alice';
      component.createRoom();

      expect(component.error).toBe('room.create.errors.roomNameRequired');
      expect(mockRoomService.createRoom).not.toHaveBeenCalled();
    });

    it('should show error for room name less than 3 characters', () => {
      component.roomName = 'AB';
      component.playerName = 'Alice';
      component.createRoom();

      expect(component.error).toBe('room.create.errors.roomNameTooShort');
      expect(mockRoomService.createRoom).not.toHaveBeenCalled();
    });

    it('should show error for room name more than 50 characters', () => {
      component.roomName = 'A'.repeat(51);
      component.playerName = 'Alice';
      component.createRoom();

      expect(component.error).toBe('room.create.errors.roomNameTooLong');
      expect(mockRoomService.createRoom).not.toHaveBeenCalled();
    });

    it('should show error for empty player name', () => {
      component.roomName = 'Valid Room Name';
      component.playerName = '';
      component.createRoom();

      expect(component.error).toBe('room.create.errors.playerNameRequired');
      expect(mockRoomService.createRoom).not.toHaveBeenCalled();
    });

    it('should show error for whitespace-only player name', () => {
      component.roomName = 'Valid Room Name';
      component.playerName = '   ';
      component.createRoom();

      expect(component.error).toBe('room.create.errors.playerNameRequired');
      expect(mockRoomService.createRoom).not.toHaveBeenCalled();
    });

    it('should show error for player name less than 2 characters', () => {
      component.roomName = 'Valid Room Name';
      component.playerName = 'A';
      component.createRoom();

      expect(component.error).toBe('room.create.errors.playerNameTooShort');
      expect(mockRoomService.createRoom).not.toHaveBeenCalled();
    });

    it('should show error for player name more than 20 characters', () => {
      component.roomName = 'Valid Room Name';
      component.playerName = 'A'.repeat(21);
      component.createRoom();

      expect(component.error).toBe('room.create.errors.playerNameTooLong');
      expect(mockRoomService.createRoom).not.toHaveBeenCalled();
    });

    it('should handle error when room creation fails', (done) => {
      component.roomName = 'Valid Room Name';
      component.playerName = 'Alice';
      mockRoomService.createRoom.and.returnValue(throwError(() => new Error('Network error')));

      component.createRoom();

      setTimeout(() => {
        expect(component.error).toBe('room.create.errors.createFailed');
        expect(component.creating).toBe(false);
        done();
      }, 100);
    });

    it('should set creating state while creating room', () => {
      component.roomName = 'Valid Room Name';
      component.playerName = 'Alice';
      mockRoomService.createRoom.and.returnValue(of(mockRoom));

      component.createRoom();

      expect(component.creating).toBe(true);
    });
  });

  describe('onSubmit', () => {
    it('should prevent default form submission and call createRoom', () => {
      const event = new Event('submit');
      spyOn(event, 'preventDefault');
      spyOn(component, 'createRoom');

      component.onSubmit(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(component.createRoom).toHaveBeenCalled();
    });
  });

  describe('clearError', () => {
    it('should clear error message', () => {
      component.error = 'Some error';
      component.clearError();

      expect(component.error).toBeNull();
    });
  });
});
