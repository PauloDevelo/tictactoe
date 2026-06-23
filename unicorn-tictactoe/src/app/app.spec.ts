import { TestBed } from '@angular/core/testing';
import { App } from './app';
import { TranslationService } from './services/translation.service';
import { OnlineGameService } from './services/online-game.service';
import { GameService } from './services/game.service';
import { AiService } from './services/ai.service';
import { BehaviorSubject, Subject } from 'rxjs';

describe('App', () => {
  let mockTranslationService: jasmine.SpyObj<TranslationService>;
  let mockOnlineGameService: jasmine.SpyObj<OnlineGameService>;
  let mockGameService: jasmine.SpyObj<GameService>;
  let mockAiService: jasmine.SpyObj<AiService>;
  let currentLanguageSubject: BehaviorSubject<'en' | 'fr'>;
  let connectionStatusSubject: BehaviorSubject<boolean>;
  let onlineGameInfoSubject: BehaviorSubject<any>;
  let errorMessageSubject: Subject<string>;
  let gameStateSubject: BehaviorSubject<any>;

  beforeEach(async () => {
    // Create BehaviorSubjects for subjects
    currentLanguageSubject = new BehaviorSubject<'en' | 'fr'>('en');
    connectionStatusSubject = new BehaviorSubject<boolean>(false);
    onlineGameInfoSubject = new BehaviorSubject<any>(null);
    errorMessageSubject = new Subject<string>();
    gameStateSubject = new BehaviorSubject<any>({
      board: Array(9).fill(null),
      currentPlayer: 'unicorn',
      status: 'in_progress',
      scores: { unicorn: 0, cat: 0 },
      winningLine: null
    });

    // Create mock TranslationService
    mockTranslationService = jasmine.createSpyObj('TranslationService', [
      'getCurrentLanguage',
      'setLanguage',
      'translate',
      'detectBrowserLanguage'
    ], {
      currentLanguage$: currentLanguageSubject.asObservable()
    });
    
    mockTranslationService.getCurrentLanguage.and.returnValue('en');
    mockTranslationService.translate.and.callFake((key: string) => {
      if (key === 'app.title') {
        return 'Unicorn Tic-Tac-Toe';
      }
      return 'Translated Text';
    });
    mockTranslationService.detectBrowserLanguage.and.returnValue({
      detected: 'en-US',
      normalized: 'en',
      fallback: false
    });

    // Create mock OnlineGameService
    mockOnlineGameService = jasmine.createSpyObj('OnlineGameService', [
      'getConnectionStatus',
      'getOnlineGameInfo',
      'getErrorMessages',
      'connect',
      'joinRoom',
      'leaveRoom',
      'disconnect'
    ]);

    mockOnlineGameService.getConnectionStatus.and.returnValue(connectionStatusSubject.asObservable());
    mockOnlineGameService.getOnlineGameInfo.and.returnValue(onlineGameInfoSubject.asObservable());
    mockOnlineGameService.getErrorMessages.and.returnValue(errorMessageSubject.asObservable());

    // Create mock GameService
    mockGameService = jasmine.createSpyObj('GameService', [
      'initializeGame',
      'getGameState',
      'makeMove',
      'resetGame',
      'getScores',
      'getGameState$',
      'getGameType',
      'setGameType',
      'getCurrentState'
    ], {
      gameState$: gameStateSubject.asObservable()
    });

    mockGameService.getGameType.and.returnValue('tictactoe');
    mockGameService.getCurrentState.and.returnValue(gameStateSubject.value);

    // Create mock AiService
    mockAiService = jasmine.createSpyObj('AiService', ['scheduleMove']);
    mockAiService.scheduleMove.and.returnValue(() => {});

    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        { provide: TranslationService, useValue: mockTranslationService },
        { provide: OnlineGameService, useValue: mockOnlineGameService },
        { provide: GameService, useValue: mockGameService },
        { provide: AiService, useValue: mockAiService }
      ]
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render title', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('🦄 Unicorn Tic-Tac-Toe 🐱');
  });
});
