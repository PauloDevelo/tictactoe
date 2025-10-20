import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { JoinRoomComponent } from './join-room.component';
import { OnlineGameService } from '../../services/online-game.service';
import { TranslationService } from '../../services/translation.service';

describe('JoinRoomComponent', () => {
  let component: JoinRoomComponent;
  let fixture: ComponentFixture<JoinRoomComponent>;
  let mockOnlineGameService: jasmine.SpyObj<OnlineGameService>;
  let mockTranslationService: jasmine.SpyObj<TranslationService>;

  beforeEach(async () => {
    mockOnlineGameService = jasmine.createSpyObj('OnlineGameService', [
      'connect',
      'joinRoom',
      'isConnected'
    ]);
    mockTranslationService = jasmine.createSpyObj('TranslationService', ['translate']);
    mockTranslationService.translate.and.callFake((key: string) => key);

    await TestBed.configureTestingModule({
      imports: [JoinRoomComponent, FormsModule],
      providers: [
        { provide: OnlineGameService, useValue: mockOnlineGameService },
        { provide: TranslationService, useValue: mockTranslationService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(JoinRoomComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('joinRoom', () => {
    beforeEach(() => {
      mockOnlineGameService.isConnected.and.returnValue(true);
    });

    it('should join room successfully with valid inputs', () => {
      component.roomId = 'ABC123';
      component.playerName = 'Player One';

      spyOn(component.roomJoined, 'emit');

      component.joinRoom();

      expect(mockOnlineGameService.joinRoom).toHaveBeenCalledWith('ABC123', 'Player One');
      expect(component.roomJoined.emit).toHaveBeenCalledWith({
        roomId: 'ABC123',
        playerName: 'Player One'
      });
      expect(component.roomId).toBe('');
      expect(component.playerName).toBe('');
      expect(component.joining).toBe(false);
      expect(component.error).toBeNull();
    });

    it('should trim and uppercase room ID', () => {
      component.roomId = '  abc123  ';
      component.playerName = 'Player One';

      component.joinRoom();

      expect(mockOnlineGameService.joinRoom).toHaveBeenCalledWith('ABC123', 'Player One');
    });

    it('should trim player name', () => {
      component.roomId = 'ABC123';
      component.playerName = '  Player One  ';

      component.joinRoom();

      expect(mockOnlineGameService.joinRoom).toHaveBeenCalledWith('ABC123', 'Player One');
    });

    it('should connect to WebSocket if not connected', () => {
      mockOnlineGameService.isConnected.and.returnValue(false);
      component.roomId = 'ABC123';
      component.playerName = 'Player One';

      component.joinRoom();

      expect(mockOnlineGameService.connect).toHaveBeenCalled();
    });

    it('should not connect if already connected', () => {
      mockOnlineGameService.isConnected.and.returnValue(true);
      component.roomId = 'ABC123';
      component.playerName = 'Player One';

      component.joinRoom();

      expect(mockOnlineGameService.connect).not.toHaveBeenCalled();
    });

    it('should show error for empty room ID', () => {
      component.roomId = '';
      component.playerName = 'Player One';

      component.joinRoom();

      expect(component.error).toBe('room.join.errors.roomIdRequired');
      expect(mockOnlineGameService.joinRoom).not.toHaveBeenCalled();
    });

    it('should show error for whitespace-only room ID', () => {
      component.roomId = '   ';
      component.playerName = 'Player One';

      component.joinRoom();

      expect(component.error).toBe('room.join.errors.roomIdRequired');
      expect(mockOnlineGameService.joinRoom).not.toHaveBeenCalled();
    });

    it('should show error for room ID not 6 characters', () => {
      component.roomId = 'ABC12';
      component.playerName = 'Player One';

      component.joinRoom();

      expect(component.error).toBe('room.join.errors.roomIdInvalid');
      expect(mockOnlineGameService.joinRoom).not.toHaveBeenCalled();
    });

    it('should show error for empty player name', () => {
      component.roomId = 'ABC123';
      component.playerName = '';

      component.joinRoom();

      expect(component.error).toBe('room.join.errors.playerNameRequired');
      expect(mockOnlineGameService.joinRoom).not.toHaveBeenCalled();
    });

    it('should show error for whitespace-only player name', () => {
      component.roomId = 'ABC123';
      component.playerName = '   ';

      component.joinRoom();

      expect(component.error).toBe('room.join.errors.playerNameRequired');
      expect(mockOnlineGameService.joinRoom).not.toHaveBeenCalled();
    });

    it('should show error for player name less than 2 characters', () => {
      component.roomId = 'ABC123';
      component.playerName = 'A';

      component.joinRoom();

      expect(component.error).toBe('room.join.errors.playerNameTooShort');
      expect(mockOnlineGameService.joinRoom).not.toHaveBeenCalled();
    });

    it('should show error for player name more than 20 characters', () => {
      component.roomId = 'ABC123';
      component.playerName = 'A'.repeat(21);

      component.joinRoom();

      expect(component.error).toBe('room.join.errors.playerNameTooLong');
      expect(mockOnlineGameService.joinRoom).not.toHaveBeenCalled();
    });

    it('should handle error when joining fails', () => {
      component.roomId = 'ABC123';
      component.playerName = 'Player One';
      mockOnlineGameService.joinRoom.and.throwError('Connection error');

      component.joinRoom();

      expect(component.error).toBe('room.join.errors.joinFailed');
      expect(component.joining).toBe(false);
    });
  });

  describe('onSubmit', () => {
    it('should prevent default form submission and call joinRoom', () => {
      const event = new Event('submit');
      spyOn(event, 'preventDefault');
      spyOn(component, 'joinRoom');

      component.onSubmit(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(component.joinRoom).toHaveBeenCalled();
    });
  });

  describe('clearError', () => {
    it('should clear error message', () => {
      component.error = 'Some error';
      component.clearError();

      expect(component.error).toBeNull();
    });
  });

  describe('formatRoomId', () => {
    it('should convert room ID to uppercase', () => {
      component.roomId = 'abc123';
      component.formatRoomId();

      expect(component.roomId).toBe('ABC123');
    });

    it('should handle empty room ID', () => {
      component.roomId = '';
      component.formatRoomId();

      expect(component.roomId).toBe('');
    });
  });
});
