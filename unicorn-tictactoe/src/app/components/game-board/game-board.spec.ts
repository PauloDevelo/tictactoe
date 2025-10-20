import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GameBoard } from './game-board';
import { GameService } from '../../services/game.service';
import { Player } from '../../models/player.model';
import { GameStatus } from '../../models/game-status.enum';
import { BehaviorSubject } from 'rxjs';

describe('GameBoard', () => {
  let component: GameBoard;
  let fixture: ComponentFixture<GameBoard>;
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

    const gameServiceSpy = jasmine.createSpyObj('GameService', ['makeMove'], {
      gameState$: gameStateSubject.asObservable()
    });

    await TestBed.configureTestingModule({
      imports: [GameBoard],
      providers: [
        { provide: GameService, useValue: gameServiceSpy }
      ]
    }).compileComponents();

    gameService = TestBed.inject(GameService) as jasmine.SpyObj<GameService>;
    fixture = TestBed.createComponent(GameBoard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with 9 cells', () => {
    expect(component.cells.length).toBe(9);
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
});
