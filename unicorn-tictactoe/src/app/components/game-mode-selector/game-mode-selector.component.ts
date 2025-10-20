import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameMode } from '../../models/game-mode.model';

@Component({
  selector: 'app-game-mode-selector',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './game-mode-selector.component.html',
  styleUrls: ['./game-mode-selector.component.css']
})
export class GameModeSelectorComponent {
  @Output() modeSelected = new EventEmitter<GameMode>();

  readonly gameModes: Array<{
    mode: GameMode;
    title: string;
    description: string;
    icon: string;
  }> = [
    {
      mode: 'local',
      title: 'Local Game',
      description: 'Play against a friend on the same device',
      icon: '👥'
    },
    {
      mode: 'ai',
      title: 'vs AI',
      description: 'Challenge the computer opponent',
      icon: '🤖'
    },
    {
      mode: 'online',
      title: 'Online Game',
      description: 'Play with friends over the internet',
      icon: '🌐'
    }
  ];

  selectMode(mode: GameMode): void {
    this.modeSelected.emit(mode);
  }
}
