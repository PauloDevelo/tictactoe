import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameCell } from '../game-cell/game-cell';
import { Player } from '../../models/player.model';
import { Cell } from '../../models/cell.model';
import { TranslationService } from '../../services/translation.service';

@Component({
  selector: 'app-connect4-board',
  imports: [CommonModule, GameCell],
  templateUrl: './connect4-board.html',
  styleUrl: './connect4-board.css'
})
export class Connect4Board {
  @Input() board: Cell[] = [];
  @Input() currentPlayer: Player = Player.UNICORN;
  @Input() winningLine: number[] | null = null;
  @Input() isGameOver: boolean = false;

  @Output() onCellClick = new EventEmitter<number>();

  readonly COLUMNS = 7;
  readonly ROWS = 6;
  readonly translationService = inject(TranslationService);

  /**
   * Array of column indices (0-6) for template iteration
   */
  get columns(): number[] {
    return Array(this.COLUMNS).fill(0).map((_, i) => i);
  }

  /**
   * Array of row indices (0-5) for template iteration
   */
  get rows(): number[] {
    return Array(this.ROWS).fill(0).map((_, i) => i);
  }

  /**
   * Check if a column is full
   */
  isColumnFull(col: number): boolean {
    const topCellIndex = col;
    return this.board[topCellIndex] !== null;
  }

  /**
   * Check if a column is clickable (not full and game is in progress)
   */
  isColumnClickable(col: number): boolean {
    return !this.isColumnFull(col) && !this.isGameOver;
  }

  /**
   * Check if a cell is in the winning line
   */
  isWinningCell(index: number): boolean {
    return this.winningLine !== null && this.winningLine.includes(index);
  }

  /**
   * Handle cell click - emits column index
   */
  onCellClickHandler(index: number): void {
    const col = index % this.COLUMNS;
    if (this.isColumnClickable(col)) {
      this.onCellClick.emit(col);
    }
  }

  /**
   * Handle a click or keyboard activation on a column.
   * This is the only entry point that should emit a column move.
   */
  onColumnClick(col: number, event?: Event): void {
    if (event) {
      event.preventDefault();
    }
    if (this.isColumnClickable(col)) {
      this.onCellClick.emit(col);
    }
  }

  /**
   * Aria label for the board
   */
  get ariaLabel(): string {
    if (this.isGameOver) {
      return this.translationService.translate('connect4.board.ariaLabel.gameOver');
    }
    const player = this.currentPlayer === Player.UNICORN
      ? this.translationService.translate('game.score.labels.unicorn')
      : this.translationService.translate('game.score.labels.cat');
    return this.translationService.translate('connect4.board.ariaLabel.inProgress', { player });
  }
}
