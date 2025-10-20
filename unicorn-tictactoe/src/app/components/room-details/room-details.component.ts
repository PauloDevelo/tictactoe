import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Room } from '../../services/room.service';
import { TranslationService } from '../../services/translation.service';

@Component({
  selector: 'app-room-details',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './room-details.component.html',
  styleUrls: ['./room-details.component.css']
})
export class RoomDetailsComponent implements OnChanges {
  @Input() room: Room | null = null;
  @Output() joinRoom = new EventEmitter<string>();
  @Output() deleteRoom = new EventEmitter<string>();
  @Output() close = new EventEmitter<void>();

  showCopiedMessage = false;

  constructor(public readonly translationService: TranslationService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['room'] && changes['room'].currentValue) {
      this.showCopiedMessage = false;
    }
  }

  /**
   * Copy room ID to clipboard
   */
  copyRoomId(): void {
    if (!this.room) return;

    navigator.clipboard.writeText(this.room.id).then(() => {
      this.showCopiedMessage = true;
      setTimeout(() => {
        this.showCopiedMessage = false;
      }, 2000);
    }).catch(err => {
      console.error('Failed to copy room ID:', err);
    });
  }

  /**
   * Handle join room action
   */
  onJoinRoom(): void {
    if (this.room) {
      this.joinRoom.emit(this.room.id);
    }
  }

  /**
   * Handle delete room action
   */
  onDeleteRoom(): void {
    if (this.room) {
      const confirmMessage = this.translationService.translate('room.details.confirmDelete')
        .replace('{roomName}', this.room.name);
      if (confirm(confirmMessage)) {
        this.deleteRoom.emit(this.room.id);
      }
    }
  }

  /**
   * Handle close action
   */
  onClose(): void {
    this.close.emit();
  }

  /**
   * Get status badge class
   */
  getStatusClass(status: string): string {
    switch (status) {
      case 'waiting':
        return 'status-waiting';
      case 'ready':
        return 'status-ready';
      case 'playing':
        return 'status-playing';
      case 'finished':
        return 'status-finished';
      default:
        return '';
    }
  }

  /**
   * Check if room can be joined
   */
  canJoinRoom(): boolean {
    if (!this.room) return false;
    return (this.room.status === 'waiting' || this.room.status === 'ready') 
           && this.room.players.length < 2;
  }

  /**
   * Check if room can be deleted
   */
  canDeleteRoom(): boolean {
    if (!this.room) return false;
    return this.room.status === 'waiting' || this.room.status === 'finished';
  }

  /**
   * Get formatted date
   */
  getFormattedDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString();
  }

  /**
   * Get winner display text
   */
  getWinnerText(): string {
    if (!this.room || !this.room.gameState.winner) return 'N/A';
    
    if (this.room.gameState.winner === 'draw') {
      return this.translationService.translate('room.details.draw');
    }

    const winner = this.room.players.find(p => p.symbol === this.room!.gameState.winner);
    return winner ? `${winner.name} (${winner.symbol})` : this.room.gameState.winner;
  }
}
