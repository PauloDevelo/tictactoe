import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GameBoard } from './game-board';
import { GameService } from '../../services/game.service';
import { OnlineGameService } from '../../services/online-game.service';
import { TranslationService } from '../../services/translation.service';
import { Player } from '../../models/player.model';
import { GameStatus } from '../../models/game-status.enum';
import { BehaviorSubject, of } from 'rxjs';

describe('GameBoard', () => {
  let component: GameBoard;
  let fixture: ComponentFixture<GameBoard>;
  let gameService: jasmine.SpyObj<GameService>;
  let onlineGameService: jasmine.SpyObj<OnlineGameService>;
  let translationService: jasmine.SpyObj<TranslationService>;
  let gameStateSubject: BehaviorSubject<any>;
  let gameTypeSubject: BehaviorSubject<any>;

  beforeEach(async () => {
    const initialState = {
      board: Array(9).fill(null),
      currentPlayer: Player.UNICORN,
      status: GameStatus.IN_PROGRESS,
      scores: { unicorn: 0, cat: 0 },
      winningLine: null
    };

    gameStateSubject = new BehaviorSubject(initialState);
    gameTypeSubject = new BehaviorSubject('tictactoe');

    const gameServiceSpy = jasmine.createSpyObj('GameService', ['makeMove'], {
      gameState$: gameStateSubject.asObservable(),
      gameType$: gameTypeSubject.asObservable()
    });

    const onlineGameServiceSpy = jasmine.createSpyObj('OnlineGameService', ['makeMove', 'getOnlineGameInfo', 'getGameState']);
    onlineGameServiceSpy.getOnlineGameInfo.and.returnValue(of(null));
    onlineGameServiceSpy.getGameState.and.returnValue(of(null));

    const translationServiceSpy = jasmine.createSpyObj('TranslationService', ['translate']);
    translationServiceSpy.translate.and.callFake((key: string) => {
      const translations: { [key: string]: string } = {
        'game.board.aria.gameBoard': 'Tic-tac-toe game board'
      };
      return translations[key] || key;
    });

    await TestBed.configureTestingModule({
      imports: [GameBoard],
      providers: [
        { provide: GameService, useValue: gameServiceSpy },
        { provide: OnlineGameService, useValue: onlineGameServiceSpy },
        { provide: TranslationService, useValue: translationServiceSpy }
      ]
    }).compileComponents();

    gameService = TestBed.inject(GameService) as jasmine.SpyObj<GameService>;
    onlineGameService = TestBed.inject(OnlineGameService) as jasmine.SpyObj<OnlineGameService>;
    translationService = TestBed.inject(TranslationService) as jasmine.SpyObj<TranslationService>;
    fixture = TestBed.createComponent(GameBoard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with 9 cells', () => {
    expect(component.tttCells.length).toBe(9);
  });

  it('should subscribe to game state on init', () => {
    expect(component.board.length).toBe(9);
    expect(component.currentPlayer).toBe(Player.UNICORN);
    expect(component.isGameOver).toBe(false);
  });

  it('should update when game state changes', () => {
    const newState = {
      board: [Player.UNICORN, null, null, null, null, null, null, null, null],
      currentPlayer: Player.CAT,
      status: GameStatus.IN_PROGRESS,
      scores: { unicorn: 0, cat: 0 },
      winningLine: null
    };

    gameStateSubject.next(newState);

    expect(component.board[0]).toBe(Player.UNICORN);
    expect(component.currentPlayer).toBe(Player.CAT);
  });

  it('should set isGameOver when status is not IN_PROGRESS', () => {
    const newState = {
      board: Array(9).fill(null),
      currentPlayer: Player.UNICORN,
      status: GameStatus.UNICORN_WINS,
      scores: { unicorn: 1, cat: 0 },
      winningLine: [0, 1, 2]
    };

    gameStateSubject.next(newState);

    expect(component.isGameOver).toBe(true);
  });

  it('should get cell player correctly', () => {
    const newState = {
      board: [Player.UNICORN, Player.CAT, null, null, null, null, null, null, null],
      currentPlayer: Player.UNICORN,
      status: GameStatus.IN_PROGRESS,
      scores: { unicorn: 0, cat: 0 },
      winningLine: null
    };

    gameStateSubject.next(newState);

    expect(component.getCellPlayer(0)).toBe(Player.UNICORN);
    expect(component.getCellPlayer(1)).toBe(Player.CAT);
    expect(component.getCellPlayer(2)).toBeNull();
  });

  it('should identify winning cells correctly', () => {
    const newState = {
      board: Array(9).fill(null),
      currentPlayer: Player.UNICORN,
      status: GameStatus.UNICORN_WINS,
      scores: { unicorn: 1, cat: 0 },
      winningLine: [0, 1, 2]
    };

    gameStateSubject.next(newState);

    expect(component.isWinningCell(0)).toBe(true);
    expect(component.isWinningCell(1)).toBe(true);
    expect(component.isWinningCell(2)).toBe(true);
    expect(component.isWinningCell(3)).toBe(false);
  });

  it('should call gameService.makeMove when cell is clicked', () => {
    component.onCellClick(4);
    expect(gameService.makeMove).toHaveBeenCalledWith(4);
  });

  it('should render with correct ARIA attributes', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const board = compiled.querySelector('.game-board');
    
    expect(board?.getAttribute('role')).toBe('grid');
    expect(board?.getAttribute('aria-label')).toBe('Tic-tac-toe game board');
  });

  it('should unsubscribe on destroy', () => {
    spyOn(component['destroy$'], 'next');
    spyOn(component['destroy$'], 'complete');

    component.ngOnDestroy();

    expect(component['destroy$'].next).toHaveBeenCalled();
    expect(component['destroy$'].complete).toHaveBeenCalled();
  });

  describe('gameType input', () => {
    it('should default to tictactoe', () => {
      expect(component.gameType).toBe('tictactoe');
    });

    it('should render TicTacToe board by default', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const tttBoard = compiled.querySelector('.game-board');
      const c4Board = compiled.querySelector('.connect4-board');

      expect(tttBoard).toBeTruthy();
      expect(c4Board).toBeNull();
    });

    it('should render Connect4 board when gameType is connect4', () => {
      component.gameType = 'connect4';
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const tttBoard = compiled.querySelector('.game-board');
      const c4Board = compiled.querySelector('.connect4-board');

      expect(tttBoard).toBeNull();
      expect(c4Board).toBeTruthy();
    });

    it('should render TicTacToe board when gameType is tictactoe', () => {
      component.gameType = 'tictactoe';
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const tttBoard = compiled.querySelector('.game-board');

      expect(tttBoard).toBeTruthy();
    });
  });

  describe('gameType from GameService', () => {
    it('should read gameType from GameService on init', () => {
      expect(component.gameType).toBe('tictactoe');
    });

    it('should switch to Connect4 board when GameService emits connect4', () => {
      gameTypeSubject.next('connect4');
      fixture.detectChanges();

      expect(component.gameType).toBe('connect4');
      const compiled = fixture.nativeElement as HTMLElement;
      const tttBoard = compiled.querySelector('.game-board');
      const c4Board = compiled.querySelector('.connect4-board');

      expect(tttBoard).toBeNull();
      expect(c4Board).toBeTruthy();
    });

    it('should switch back to TicTacToe board when GameService emits tictactoe', () => {
      gameTypeSubject.next('connect4');
      fixture.detectChanges();

      gameTypeSubject.next('tictactoe');
      fixture.detectChanges();

      expect(component.gameType).toBe('tictactoe');
      const compiled = fixture.nativeElement as HTMLElement;
      const tttBoard = compiled.querySelector('.game-board');
      const c4Board = compiled.querySelector('.connect4-board');

      expect(tttBoard).toBeTruthy();
      expect(c4Board).toBeNull();
    });

    it('should toggle between game types multiple times', () => {
      // TTT -> C4 -> TTT -> C4
      gameTypeSubject.next('connect4');
      fixture.detectChanges();
      expect(component.gameType).toBe('connect4');

      gameTypeSubject.next('tictactoe');
      fixture.detectChanges();
      expect(component.gameType).toBe('tictactoe');

      gameTypeSubject.next('connect4');
      fixture.detectChanges();
      expect(component.gameType).toBe('connect4');

      gameTypeSubject.next('tictactoe');
      fixture.detectChanges();
      expect(component.gameType).toBe('tictactoe');
    });
  });

  describe('Connect4 column click', () => {
    it('should call gameService.makeMove with column index', () => {
      component.onColumnClick(3);
      expect(gameService.makeMove).toHaveBeenCalledWith(3);
    });

    it('should call gameService.makeMove with column 0', () => {
      component.onColumnClick(0);
      expect(gameService.makeMove).toHaveBeenCalledWith(0);
    });

    it('should call gameService.makeMove with column 6', () => {
      component.onColumnClick(6);
      expect(gameService.makeMove).toHaveBeenCalledWith(6);
    });

    it('should not call makeMove when game is over', () => {
      component.isGameOver = true;
      component.onColumnClick(3);
      expect(gameService.makeMove).not.toHaveBeenCalled();
    });

    it('should not call makeMove when column is full', () => {
      component.board[3] = Player.UNICORN;
      component.onColumnClick(3);
      expect(gameService.makeMove).not.toHaveBeenCalled();
    });

    it('should call makeMove for all valid columns when game is in progress', () => {
      component.isGameOver = false;
      component.board = Array(42).fill(null);
      for (let col = 0; col < 7; col++) {
        gameService.makeMove.calls.reset();
        component.onColumnClick(col);
        expect(gameService.makeMove).toHaveBeenCalledWith(col);
      }
    });

    it('should render Connect4Board component when gameType is connect4', () => {
      component.gameType = 'connect4';
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const c4Board = compiled.querySelector('app-connect4-board');
      expect(c4Board).toBeTruthy();
    });
  });

  describe('Connect4 board arrays', () => {
    it('should have c4Rows with 6 elements', () => {
      expect(component.c4Rows.length).toBe(6);
    });

    it('should have c4Columns with 7 elements', () => {
      expect(component.c4Columns.length).toBe(7);
    });

    it('should have c4Rows values 0-5', () => {
      expect(component.c4Rows).toEqual([0, 1, 2, 3, 4, 5]);
    });

    it('should have c4Columns values 0-6', () => {
      expect(component.c4Columns).toEqual([0, 1, 2, 3, 4, 5, 6]);
    });
  });

  describe('Connect4 winning line handling', () => {
    it('should identify Connect4 winning cells correctly', () => {
      const c4WinningLine = [0, 7, 14, 21]; // Vertical win in column 0
      const newState = {
        board: Array(42).fill(null),
        currentPlayer: Player.UNICORN,
        status: GameStatus.UNICORN_WINS,
        scores: { unicorn: 1, cat: 0 },
        winningLine: c4WinningLine
      };

      gameStateSubject.next(newState);

      expect(component.isWinningCell(0)).toBe(true);
      expect(component.isWinningCell(7)).toBe(true);
      expect(component.isWinningCell(14)).toBe(true);
      expect(component.isWinningCell(21)).toBe(true);
      expect(component.isWinningCell(1)).toBe(false);
    });

    it('should handle horizontal Connect4 winning line', () => {
      const c4WinningLine = [0, 1, 2, 3]; // Horizontal win in row 0
      const newState = {
        board: Array(42).fill(null),
        currentPlayer: Player.CAT,
        status: GameStatus.CAT_WINS,
        scores: { unicorn: 0, cat: 1 },
        winningLine: c4WinningLine
      };

      gameStateSubject.next(newState);

      expect(component.isWinningCell(0)).toBe(true);
      expect(component.isWinningCell(1)).toBe(true);
      expect(component.isWinningCell(2)).toBe(true);
      expect(component.isWinningCell(3)).toBe(true);
      expect(component.isWinningCell(4)).toBe(false);
    });

    it('should handle diagonal Connect4 winning line', () => {
      const c4WinningLine = [0, 8, 16, 24]; // Diagonal win
      const newState = {
        board: Array(42).fill(null),
        currentPlayer: Player.UNICORN,
        status: GameStatus.UNICORN_WINS,
        scores: { unicorn: 1, cat: 0 },
        winningLine: c4WinningLine
      };

      gameStateSubject.next(newState);

      expect(component.isWinningCell(0)).toBe(true);
      expect(component.isWinningCell(8)).toBe(true);
      expect(component.isWinningCell(16)).toBe(true);
      expect(component.isWinningCell(24)).toBe(true);
      expect(component.isWinningCell(1)).toBe(false);
    });
  });

  describe('Connect4 state updates from GameService', () => {
    it('should update board state for Connect4 game', () => {
      component.gameType = 'connect4';
      fixture.detectChanges();

      const c4Board = Array(42).fill(null);
      c4Board[0] = Player.UNICORN; // Column 0, row 0
      c4Board[35] = Player.CAT;    // Column 0, row 5

      const newState = {
        board: c4Board,
        currentPlayer: Player.UNICORN,
        status: GameStatus.IN_PROGRESS,
        scores: { unicorn: 0, cat: 0 },
        winningLine: null
      };

      gameStateSubject.next(newState);

      expect(component.board[0]).toBe(Player.UNICORN);
      expect(component.board[35]).toBe(Player.CAT);
    });

    it('should set isGameOver for Connect4 when game ends', () => {
      component.gameType = 'connect4';
      fixture.detectChanges();

      const newState = {
        board: Array(42).fill(null),
        currentPlayer: Player.UNICORN,
        status: GameStatus.UNICORN_WINS,
        scores: { unicorn: 1, cat: 0 },
        winningLine: [0, 7, 14, 21]
      };

      gameStateSubject.next(newState);

      expect(component.isGameOver).toBe(true);
    });

    it('should update winningLine for Connect4', () => {
      component.gameType = 'connect4';
      fixture.detectChanges();

      const newState = {
        board: Array(42).fill(null),
        currentPlayer: Player.CAT,
        status: GameStatus.CAT_WINS,
        scores: { unicorn: 0, cat: 1 },
        winningLine: [5, 6, 7, 8]
      };

      gameStateSubject.next(newState);

      expect(component.winningLine).toEqual([5, 6, 7, 8]);
    });
  });

  describe('Cell clickability for Connect4', () => {
    it('should allow clicking empty cells in TTT mode', () => {
      component.board = Array(9).fill(null);
      component.isGameOver = false;
      expect(component.isCellClickable(0)).toBe(true);
    });

    it('should not allow clicking occupied cells in TTT mode', () => {
      component.board = [Player.UNICORN, null, null, null, null, null, null, null, null];
      component.isGameOver = false;
      expect(component.isCellClickable(0)).toBe(false);
      expect(component.isCellClickable(1)).toBe(true);
    });
  });

  describe('Game type switching with state preservation', () => {
    it('should maintain board state when switching from TTT to C4', () => {
      component.board = [Player.UNICORN, null, null, null, null, null, null, null, null];
      component.gameType = 'connect4';
      fixture.detectChanges();

      expect(component.board[0]).toBe(Player.UNICORN);
    });

    it('should maintain game over state when switching game types', () => {
      component.isGameOver = true;
      component.gameType = 'connect4';
      fixture.detectChanges();

      expect(component.isGameOver).toBe(true);
    });
  });
});
