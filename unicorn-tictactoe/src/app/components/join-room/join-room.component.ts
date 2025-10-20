import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OnlineGameService } from '../../services/online-game.service';

export interface JoinRoomData {
  roomId: string;
  playerName: string;
}

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

  constructor(private onlineGameService: OnlineGameService) {}

  /**
   * Join a room
   */
  joinRoom(): void {
    // Validate inputs
    const trimmedRoomId = this.roomId.trim().toUpperCase();
    const trimmedPlayerName = this.playerName.trim();

    if (!trimmedRoomId) {
      this.error = 'Room ID is required';
      return;
    }

    if (trimmedRoomId.length !== 6) {
      this.error = 'Room ID must be 6 characters';
      return;
    }

    if (!trimmedPlayerName) {
      this.error = 'Player name is required';
      return;
    }

    if (trimmedPlayerName.length < 2) {
      this.error = 'Player name must be at least 2 characters';
      return;
    }

    if (trimmedPlayerName.length > 20) {
      this.error = 'Player name must be less than 20 characters';
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
      this.error = 'Failed to join room. Please try again.';
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
