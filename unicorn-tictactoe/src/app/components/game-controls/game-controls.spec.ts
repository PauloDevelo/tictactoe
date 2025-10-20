import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GameControls } from './game-controls';
import { GameService } from '../../services/game.service';
import { Player } from '../../models/player.model';
import { GameStatus } from '../../models/game-status.enum';
import { BehaviorSubject } from 'rxjs';

describe('GameControls', () => {
  let component: GameControls;
  let fixture: ComponentFixture<GameControls>;
  let gameService: jasmine.SpyObj<GameService>;
  let gameStateSubject: BehaviorSubject<any>;

  beforeEach(async () => {
    const initialState = {
      board: Array(9).fill(null),
      currentPlayer: Player.UNICORN,
      status: GameStatus.IN_PROGRESS,
      scores: { unicorn: 0, cat: 0 },
      winningLine: null
    };

    gameStateSubject = new BehaviorSubject(initialState);

    const gameServiceSpy = jasmine.createSpyObj('GameService', ['resetGame'], {
      gameState$: gameStateSubject.asObservable()
    });

    await TestBed.configureTestingModule({
      imports: [GameControls],
      providers: [
        { provide: GameService, useValue: gameServiceSpy }
      ]
    }).compileComponents();

    gameService = TestBed.inject(GameService) as jasmine.SpyObj<GameService>;
    fixture = TestBed.createComponent(GameControls);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Status Messages', () => {
    it('should show Unicorn turn message when in progress and Unicorn turn', () => {
      expect(component.statusMessage).toBe('🦄 Unicorn\'s Turn');
    });

    it('should show Cat turn message when in progress and Cat turn', () => {
      gameStateSubject.next({
        board: Array(9).fill(null),
        currentPlayer: Player.CAT,
        status: GameStatus.IN_PROGRESS,
        scores: { unicorn: 0, cat: 0 },
        winningLine: null
      });

      expect(component.statusMessage).toBe('🐱 Cat\'s Turn');
    });

    it('should show Unicorn wins message', () => {
      gameStateSubject.next({
        board: Array(9).fill(null),
        currentPlayer: Player.UNICORN,
        status: GameStatus.UNICORN_WINS,
        scores: { unicorn: 1, cat: 0 },
        winningLine: [0, 1, 2]
      });

      expect(component.statusMessage).toBe('🦄 Unicorn Wins! 🎉');
    });

    it('should show Cat wins message', () => {
      gameStateSubject.next({
        board: Array(9).fill(null),
        currentPlayer: Player.CAT,
        status: GameStatus.CAT_WINS,
        scores: { unicorn: 0, cat: 1 },
        winningLine: [0, 1, 2]
      });

      expect(component.statusMessage).toBe('🐱 Cat Wins! 🎉');
    });

    it('should show draw message', () => {
      gameStateSubject.next({
        board: Array(9).fill(Player.UNICORN),
        currentPlayer: Player.UNICORN,
        status: GameStatus.DRAW,
        scores: { unicorn: 0, cat: 0 },
        winningLine: null
      });

      expect(component.statusMessage).toBe('🤝 It\'s a Draw!');
    });
  });

  describe('Status Classes', () => {
    it('should return in-progress class when game is in progress', () => {
      expect(component.statusClass).toBe('in-progress');
    });

    it('should return unicorn-wins class when Unicorn wins', () => {
      gameStateSubject.next({
        board: Array(9).fill(null),
        currentPlayer: Player.UNICORN,
        status: GameStatus.UNICORN_WINS,
        scores: { unicorn: 1, cat: 0 },
        winningLine: [0, 1, 2]
      });

      expect(component.statusClass).toBe('unicorn-wins');
    });

    it('should return cat-wins class when Cat wins', () => {
      gameStateSubject.next({
        board: Array(9).fill(null),
        currentPlayer: Player.CAT,
        status: GameStatus.CAT_WINS,
        scores: { unicorn: 0, cat: 1 },
        winningLine: [0, 1, 2]
      });

      expect(component.statusClass).toBe('cat-wins');
    });

    it('should return draw class when game is a draw', () => {
      gameStateSubject.next({
        board: Array(9).fill(Player.UNICORN),
        currentPlayer: Player.UNICORN,
        status: GameStatus.DRAW,
        scores: { unicorn: 0, cat: 0 },
        winningLine: null
      });

      expect(component.statusClass).toBe('draw');
    });
  });

  describe('Game Over State', () => {
    it('should return false when game is in progress', () => {
      expect(component.isGameOver).toBe(false);
    });

    it('should return true when game is won', () => {
      gameStateSubject.next({
        board: Array(9).fill(null),
        currentPlayer: Player.UNICORN,
        status: GameStatus.UNICORN_WINS,
        scores: { unicorn: 1, cat: 0 },
        winningLine: [0, 1, 2]
      });

      expect(component.isGameOver).toBe(true);
    });

    it('should return true when game is a draw', () => {
      gameStateSubject.next({
        board: Array(9).fill(Player.UNICORN),
        currentPlayer: Player.UNICORN,
        status: GameStatus.DRAW,
        scores: { unicorn: 0, cat: 0 },
        winningLine: null
      });

      expect(component.isGameOver).toBe(true);
    });
  });

  describe('Reset Button', () => {
    it('should call gameService.resetGame when clicked', () => {
      component.onResetClick();
      expect(gameService.resetGame).toHaveBeenCalled();
    });

    it('should display "New Game" when game is over', () => {
      gameStateSubject.next({
        board: Array(9).fill(null),
        currentPlayer: Player.UNICORN,
        status: GameStatus.UNICORN_WINS,
        scores: { unicorn: 1, cat: 0 },
        winningLine: [0, 1, 2]
      });
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const button = compiled.querySelector('.reset-button');
      expect(button?.textContent?.trim()).toBe('🎮 New Game');
    });

    it('should display "Reset Game" when game is in progress', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const button = compiled.querySelector('.reset-button');
      expect(button?.textContent?.trim()).toBe('🔄 Reset Game');
    });
  });

  describe('Accessibility', () => {
    it('should have aria-live region for status', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const status = compiled.querySelector('.status-message');
      
      expect(status?.getAttribute('role')).toBe('status');
      expect(status?.getAttribute('aria-live')).toBe('polite');
      expect(status?.getAttribute('aria-atomic')).toBe('true');
    });

    it('should have aria-label on reset button', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const button = compiled.querySelector('.reset-button');
      
      expect(button?.getAttribute('aria-label')).toBe('Reset current game');
    });

    it('should update aria-label when game is over', () => {
      gameStateSubject.next({
        board: Array(9).fill(null),
        currentPlayer: Player.UNICORN,
        status: GameStatus.UNICORN_WINS,
        scores: { unicorn: 1, cat: 0 },
        winningLine: [0, 1, 2]
      });
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const button = compiled.querySelector('.reset-button');
      
      expect(button?.getAttribute('aria-label')).toBe('Start a new game');
    });
  });

  it('should unsubscribe on destroy', () => {
    spyOn(component['destroy$'], 'next');
    spyOn(component['destroy$'], 'complete');

    component.ngOnDestroy();

    expect(component['destroy$'].next).toHaveBeenCalled();
    expect(component['destroy$'].complete).toHaveBeenCalled();
  });
});
