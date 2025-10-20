import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RoomService, Room } from '../../services/room.service';
import { TranslationService } from '../../services/translation.service';

export interface CreateRoomData {
  room: Room;
  playerName: string;
}

@Component({
  selector: 'app-create-room',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './create-room.component.html',
  styleUrls: ['./create-room.component.css']
})
export class CreateRoomComponent {
  @Output() roomCreated = new EventEmitter<CreateRoomData>();

  roomName = '';
  playerName = '';
  creating = false;
  error: string | null = null;

  constructor(
    private roomService: RoomService,
    public readonly translationService: TranslationService
  ) {}

  /**
   * Create a new room
   */
  createRoom(): void {
    const trimmedName = this.roomName.trim();
    const trimmedPlayerName = this.playerName.trim();

    if (!trimmedName) {
      this.error = this.translationService.translate('room.create.errors.roomNameRequired');
      return;
    }

    if (trimmedName.length < 3) {
      this.error = this.translationService.translate('room.create.errors.roomNameTooShort');
      return;
    }

    if (trimmedName.length > 50) {
      this.error = this.translationService.translate('room.create.errors.roomNameTooLong');
      return;
    }

    if (!trimmedPlayerName) {
      this.error = this.translationService.translate('room.create.errors.playerNameRequired');
      return;
    }

    if (trimmedPlayerName.length < 2) {
      this.error = this.translationService.translate('room.create.errors.playerNameTooShort');
      return;
    }

    if (trimmedPlayerName.length > 20) {
      this.error = this.translationService.translate('room.create.errors.playerNameTooLong');
      return;
    }

    this.creating = true;
    this.error = null;

    this.roomService.createRoom(trimmedName).subscribe({
      next: (room) => {
        this.roomCreated.emit({ room, playerName: trimmedPlayerName });
        this.roomName = '';
        this.playerName = '';
        this.creating = false;
      },
      error: (err) => {
        this.error = this.translationService.translate('room.create.errors.createFailed');
        this.creating = false;
        console.error('Error creating room:', err);
      }
    });
  }

  /**
   * Handle form submission
   */
  onSubmit(event: Event): void {
    event.preventDefault();
    this.createRoom();
  }

  /**
   * Clear error message
   */
  clearError(): void {
    this.error = null;
  }
}
