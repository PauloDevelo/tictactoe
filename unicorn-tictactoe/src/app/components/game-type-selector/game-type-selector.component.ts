import { Component, EventEmitter, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameType } from '../../models/game-type.model';
import { GameService } from '../../services/game.service';
import { TranslationService } from '../../services/translation.service';

@Component({
  selector: 'app-game-type-selector',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './game-type-selector.component.html',
  styleUrls: ['./game-type-selector.component.css']
})
export class GameTypeSelectorComponent {
  @Output() gameTypeSelected = new EventEmitter<GameType>();

  readonly gameService = inject(GameService);
  readonly translationService = inject(TranslationService);

  readonly gameTypes: Array<{
    type: GameType;
    labelKey: string;
    icon: string;
  }> = [
    {
      type: 'tictactoe',
      labelKey: 'gameType.tictactoe',
      icon: '❌⭕'
    },
    {
      type: 'connect4',
      labelKey: 'gameType.connect4',
      icon: '🔴🟡'
    }
  ];

  get selectedType(): GameType {
    return this.gameService.getGameType();
  }

  get selectorTitle(): string {
    return this.translationService.translate('gameTypeSelector.title');
  }

  getGameTypeLabel(type: GameType): string {
    return this.translationService.translate(`gameType.${type}`);
  }

  selectGameType(type: GameType): void {
    this.gameService.setGameType(type);
    this.gameTypeSelected.emit(type);
  }
}
