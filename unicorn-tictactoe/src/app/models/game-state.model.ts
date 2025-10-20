import { Player } from './player.model';
import { GameStatus } from './game-status.enum';
import { Cell } from './cell.model';

export interface GameState {
  board: Cell[];
  currentPlayer: Player;
  status: GameStatus;
  scores: {
    unicorn: number;
    cat: number;
  };
  winningLine: number[] | null;
}
