import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ScoreBoard } from './score-board';
import { GameService } from '../../services/game.service';
import { OnlineGameService } from '../../services/online-game.service';
import { TranslationService } from '../../services/translation.service';
import { Player } from '../../models/player.model';
import { GameStatus } from '../../models/game-status.enum';
import { BehaviorSubject, of } from 'rxjs';

describe('ScoreBoard', () => {
  let component: ScoreBoard;
  let fixture: ComponentFixture<ScoreBoard>;
  let gameService: jasmine.SpyObj<GameService>;
  let onlineGameService: jasmine.SpyObj<OnlineGameService>;
  let translationService: jasmine.SpyObj<TranslationService>;
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

    const gameServiceSpy = jasmine.createSpyObj('GameService', [], {
      gameState$: gameStateSubject.asObservable()
    });

    const onlineGameServiceSpy = jasmine.createSpyObj('OnlineGameService', ['getOnlineGameInfo', 'getGameState']);
    onlineGameServiceSpy.getOnlineGameInfo.and.returnValue(of(null));
    onlineGameServiceSpy.getGameState.and.returnValue(of(null));

    const translationServiceSpy = jasmine.createSpyObj('TranslationService', ['translate']);
    translationServiceSpy.translate.and.callFake((key: string, params?: any) => {
      const translations: { [key: string]: string } = {
        'game.score.labels.unicorn': 'Unicorn',
        'game.score.labels.cat': 'Cat',
        'game.score.labels.score': 'Score',
        'game.score.labels.yourTurn': 'Your Turn',
        'game.score.labels.vs': 'VS',
        'game.score.aria.scoreBoard': 'Game scores',
        'game.score.aria.currentTurn': ', current turn'
      };
      
      if (key === 'game.score.aria.unicornPlayer') {
        return `Unicorn player, score: ${params?.score}${params?.turn || ''}`;
      }
      if (key === 'game.score.aria.catPlayer') {
        return `Cat player, score: ${params?.score}${params?.turn || ''}`;
      }
      
      return translations[key] || key;
    });

    await TestBed.configureTestingModule({
      imports: [ScoreBoard],
      providers: [
        { provide: GameService, useValue: gameServiceSpy },
        { provide: OnlineGameService, useValue: onlineGameServiceSpy },
        { provide: TranslationService, useValue: translationServiceSpy }
      ]
    }).compileComponents();

    gameService = TestBed.inject(GameService) as jasmine.SpyObj<GameService>;
    onlineGameService = TestBed.inject(OnlineGameService) as jasmine.SpyObj<OnlineGameService>;
    translationService = TestBed.inject(TranslationService) as jasmine.SpyObj<TranslationService>;
    fixture = TestBed.createComponent(ScoreBoard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with zero scores', () => {
    expect(component.unicornScore).toBe(0);
    expect(component.catScore).toBe(0);
  });

  it('should initialize with Unicorn as current player', () => {
    expect(component.currentPlayer).toBe(Player.UNICORN);
  });

  it('should update scores when game state changes', () => {
    gameStateSubject.next({
      board: Array(9).fill(null),
      currentPlayer: Player.UNICORN,
      status: GameStatus.IN_PROGRESS,
      scores: { unicorn: 3, cat: 2 },
      winningLine: null
    });

    expect(component.unicornScore).toBe(3);
    expect(component.catScore).toBe(2);
  });

  it('should update current player when game state changes', () => {
    gameStateSubject.next({
      board: Array(9).fill(null),
      currentPlayer: Player.CAT,
      status: GameStatus.IN_PROGRESS,
      scores: { unicorn: 0, cat: 0 },
      winningLine: null
    });

    expect(component.currentPlayer).toBe(Player.CAT);
  });

  describe('Turn Indicators', () => {
    it('should indicate Unicorn turn when current player is Unicorn', () => {
      expect(component.isUnicornTurn).toBe(true);
      expect(component.isCatTurn).toBe(false);
    });

    it('should indicate Cat turn when current player is Cat', () => {
      gameStateSubject.next({
        board: Array(9).fill(null),
        currentPlayer: Player.CAT,
        status: GameStatus.IN_PROGRESS,
        scores: { unicorn: 0, cat: 0 },
        winningLine: null
      });

      expect(component.isUnicornTurn).toBe(false);
      expect(component.isCatTurn).toBe(true);
    });
  });

  describe('Rendering', () => {
    it('should display Unicorn score', () => {
      gameStateSubject.next({
        board: Array(9).fill(null),
        currentPlayer: Player.UNICORN,
        status: GameStatus.IN_PROGRESS,
        scores: { unicorn: 5, cat: 3 },
        winningLine: null
      });
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const unicornScore = compiled.querySelector('.unicorn .score');
      expect(unicornScore?.textContent?.trim()).toBe('5');
    });

    it('should display Cat score', () => {
      gameStateSubject.next({
        board: Array(9).fill(null),
        currentPlayer: Player.UNICORN,
        status: GameStatus.IN_PROGRESS,
        scores: { unicorn: 2, cat: 7 },
        winningLine: null
      });
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const catScore = compiled.querySelector('.cat .score');
      expect(catScore?.textContent?.trim()).toBe('7');
    });

    it('should show turn indicator for Unicorn when it is Unicorn turn', () => {
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const unicornTurnIndicator = compiled.querySelector('.unicorn .turn-indicator');
      const catTurnIndicator = compiled.querySelector('.cat .turn-indicator');
      
      expect(unicornTurnIndicator).toBeTruthy();
      expect(catTurnIndicator).toBeFalsy();
    });

    it('should show turn indicator for Cat when it is Cat turn', () => {
      gameStateSubject.next({
        board: Array(9).fill(null),
        currentPlayer: Player.CAT,
        status: GameStatus.IN_PROGRESS,
        scores: { unicorn: 0, cat: 0 },
        winningLine: null
      });
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const unicornTurnIndicator = compiled.querySelector('.unicorn .turn-indicator');
      const catTurnIndicator = compiled.querySelector('.cat .turn-indicator');
      
      expect(unicornTurnIndicator).toBeFalsy();
      expect(catTurnIndicator).toBeTruthy();
    });

    it('should apply active class to current player', () => {
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const unicornScore = compiled.querySelector('.unicorn');
      const catScore = compiled.querySelector('.cat');
      
      expect(unicornScore?.classList.contains('active')).toBe(true);
      expect(catScore?.classList.contains('active')).toBe(false);
    });
  });

  describe('Accessibility', () => {
    it('should have region role with aria-label', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const scoreBoard = compiled.querySelector('.score-board');
      
      expect(scoreBoard?.getAttribute('role')).toBe('region');
      expect(scoreBoard?.getAttribute('aria-label')).toBe('Game scores');
    });

    it('should have group role for player scores', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const unicornScore = compiled.querySelector('.unicorn');
      const catScore = compiled.querySelector('.cat');
      
      expect(unicornScore?.getAttribute('role')).toBe('group');
      expect(catScore?.getAttribute('role')).toBe('group');
    });

    it('should have descriptive aria-label for Unicorn player', () => {
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const unicornScore = compiled.querySelector('.unicorn');
      
      expect(unicornScore?.getAttribute('aria-label')).toContain('Unicorn player');
      expect(unicornScore?.getAttribute('aria-label')).toContain('score: 0');
      expect(unicornScore?.getAttribute('aria-label')).toContain('current turn');
    });

    it('should have descriptive aria-label for Cat player', () => {
      gameStateSubject.next({
        board: Array(9).fill(null),
        currentPlayer: Player.CAT,
        status: GameStatus.IN_PROGRESS,
        scores: { unicorn: 0, cat: 0 },
        winningLine: null
      });
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const catScore = compiled.querySelector('.cat');
      
      expect(catScore?.getAttribute('aria-label')).toContain('Cat player');
      expect(catScore?.getAttribute('aria-label')).toContain('score: 0');
      expect(catScore?.getAttribute('aria-label')).toContain('current turn');
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
