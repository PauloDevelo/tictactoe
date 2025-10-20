import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Player } from '../../models/player.model';
import { TranslationService } from '../../services/translation.service';

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

  constructor(private translationService: TranslationService) {}

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
    const position = this.translationService.translate('game.cell.aria.cellPosition', { position: this.cellIndex + 1 });
    
    if (this.player === Player.UNICORN) {
      return `${position}, ${this.translationService.translate('game.cell.aria.occupiedByUnicorn')}`;
    }
    if (this.player === Player.CAT) {
      return `${position}, ${this.translationService.translate('game.cell.aria.occupiedByCat')}`;
    }
    if (this.isGameOver) {
      return `${position}, ${this.translationService.translate('game.cell.aria.empty')}, ${this.translationService.translate('game.cell.aria.gameOver')}`;
    }
    const playerName = this.currentPlayer === Player.UNICORN 
      ? this.translationService.translate('game.score.labels.unicorn')
      : this.translationService.translate('game.score.labels.cat');
    return `${position}, ${this.translationService.translate('game.cell.aria.empty')}, ${this.translationService.translate('game.cell.aria.clickToPlace', { player: playerName })}`;
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
