import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OnlineGameService } from '../../services/online-game.service';
import { TranslationService } from '../../services/translation.service';

export interface JoinRoomData {
  roomId: string;
  playerName: string;
}

/**
 * @deprecated This component has been replaced by JoinRoomModalComponent.
 * The join room functionality is now integrated into the room list via a modal dialog.
 * This component is kept for reference but is no longer used in the application.
 * See: app/components/join-room-modal/join-room-modal.component.ts
 */
@Component({
  selector: 'app-join-room',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './join-room.component.html',
  styleUrls: ['./join-room.component.css']
})
export class JoinRoomComponent {
  @Output() roomJoined = new EventEmitter<JoinRoomData>();

  roomId = '';
  playerName = '';
  joining = false;
  error: string | null = null;

  constructor(
    private onlineGameService: OnlineGameService,
    public readonly translationService: TranslationService
  ) {}

  /**
   * Join a room
   */
  joinRoom(): void {
    // Validate inputs
    const trimmedRoomId = this.roomId.trim().toUpperCase();
    const trimmedPlayerName = this.playerName.trim();

    if (!trimmedRoomId) {
      this.error = this.translationService.translate('room.join.errors.roomIdRequired');
      return;
    }

    if (trimmedRoomId.length !== 6) {
      this.error = this.translationService.translate('room.join.errors.roomIdInvalid');
      return;
    }

    if (!trimmedPlayerName) {
      this.error = this.translationService.translate('room.join.errors.playerNameRequired');
      return;
    }

    if (trimmedPlayerName.length < 2) {
      this.error = this.translationService.translate('room.join.errors.playerNameTooShort');
      return;
    }

    if (trimmedPlayerName.length > 20) {
      this.error = this.translationService.translate('room.join.errors.playerNameTooLong');
      return;
    }

    this.joining = true;
    this.error = null;

    try {
      // Connect to WebSocket if not already connected
      if (!this.onlineGameService.isConnected()) {
        this.onlineGameService.connect();
      }

      // Join the room
      this.onlineGameService.joinRoom(trimmedRoomId, trimmedPlayerName);

      // Emit success event
      this.roomJoined.emit({
        roomId: trimmedRoomId,
        playerName: trimmedPlayerName
      });

      // Reset form
      this.roomId = '';
      this.playerName = '';
      this.joining = false;
    } catch (err) {
      this.error = this.translationService.translate('room.join.errors.joinFailed');
      this.joining = false;
      console.error('Error joining room:', err);
    }
  }

  /**
   * Handle form submission
   */
  onSubmit(event: Event): void {
    event.preventDefault();
    this.joinRoom();
  }

  /**
   * Clear error message
   */
  clearError(): void {
    this.error = null;
  }

  /**
   * Format room ID to uppercase
   */
  formatRoomId(): void {
    this.roomId = this.roomId.toUpperCase();
  }
}
