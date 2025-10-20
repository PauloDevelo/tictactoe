import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RoomService, Room } from '../../services/room.service';

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

  constructor(private roomService: RoomService) {}

  /**
   * Create a new room
   */
  createRoom(): void {
    const trimmedName = this.roomName.trim();
    const trimmedPlayerName = this.playerName.trim();

    if (!trimmedName) {
      this.error = 'Room name is required';
      return;
    }

    if (trimmedName.length < 3) {
      this.error = 'Room name must be at least 3 characters';
      return;
    }

    if (trimmedName.length > 50) {
      this.error = 'Room name must be less than 50 characters';
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
        this.error = 'Failed to create room. Please try again.';
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
