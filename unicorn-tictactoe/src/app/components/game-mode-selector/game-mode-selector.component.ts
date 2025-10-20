import { Component, EventEmitter, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameMode } from '../../models/game-mode.model';
import { TranslationService } from '../../services/translation.service';

@Component({
  selector: 'app-game-mode-selector',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './game-mode-selector.component.html',
  styleUrls: ['./game-mode-selector.component.css']
})
export class GameModeSelectorComponent {
  @Output() modeSelected = new EventEmitter<GameMode>();

  readonly translationService = inject(TranslationService);

  readonly gameModes: Array<{
    mode: GameMode;
    titleKey: string;
    descriptionKey: string;
    icon: string;
  }> = [
    {
      mode: 'local',
      titleKey: 'gameMode.local.title',
      descriptionKey: 'gameMode.local.description',
      icon: '👥'
    },
    {
      mode: 'ai',
      titleKey: 'gameMode.ai.title',
      descriptionKey: 'gameMode.ai.description',
      icon: '🤖'
    },
    {
      mode: 'online',
      titleKey: 'gameMode.online.title',
      descriptionKey: 'gameMode.online.description',
      icon: '🌐'
    }
  ];

  selectMode(mode: GameMode): void {
    this.modeSelected.emit(mode);
  }
}
