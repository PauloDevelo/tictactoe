import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Player } from '../../models/player.model';

@Component({
  selector: 'app-game-cell',
  imports: [CommonModule],
  templateUrl: './game-cell.html',
  styleUrl: './game-cell.css'
})
export class GameCell {
  @Input() player: Player | null = null;
  @Input() currentPlayer: Player = Player.UNICORN;
  @Input() isGameOver: boolean = false;
  @Input() isWinningCell: boolean = false;
  @Input() cellIndex: number = 0;

  @Output() cellClicked = new EventEmitter<void>();

  get isDisabled(): boolean {
    return this.player !== null || this.isGameOver;
  }

  get displayIcon(): string {
    if (this.player === Player.UNICORN) return '🦄';
    if (this.player === Player.CAT) return '🐱';
    return '';
  }

  get previewIcon(): string {
    if (this.player !== null || this.isGameOver) return '';
    return this.currentPlayer === Player.UNICORN ? '🦄' : '🐱';
  }

  get ariaLabel(): string {
    const position = `Cell ${this.cellIndex + 1}`;
    
    if (this.player === Player.UNICORN) {
      return `${position}, occupied by Unicorn`;
    }
    if (this.player === Player.CAT) {
      return `${position}, occupied by Cat`;
    }
    if (this.isGameOver) {
      return `${position}, empty, game over`;
    }
    return `${position}, empty, click to place ${this.currentPlayer === Player.UNICORN ? 'Unicorn' : 'Cat'}`;
  }

  onClick(): void {
    if (!this.isDisabled) {
      this.cellClicked.emit();
    }
  }

  onKeyPress(event: Event): void {
    if (!this.isDisabled) {
      event.preventDefault();
      this.cellClicked.emit();
    }
  }
}
