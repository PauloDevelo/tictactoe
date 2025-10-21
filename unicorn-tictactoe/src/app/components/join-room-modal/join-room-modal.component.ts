import { Component, Input, Output, EventEmitter, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Room } from '../../services/room.service';
import { TranslationService } from '../../services/translation.service';

export interface JoinRoomModalData {
  roomId: string;
  playerName: string;
}

@Component({
  selector: 'app-join-room-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './join-room-modal.component.html',
  styleUrls: ['./join-room-modal.component.css']
})
export class JoinRoomModalComponent {
  @Input() room: Room | null = null;
  @Input() isVisible = false;
  @Output() joinRequested = new EventEmitter<JoinRoomModalData>();
  @Output() closeRequested = new EventEmitter<void>();

  playerName = '';
  isJoining = false;

  constructor(
    public readonly translationService: TranslationService
  ) {}

  /**
   * Handle join button click
   */
  onJoin(): void {
    if (!this.canJoin()) {
      return;
    }

    const trimmedPlayerName = this.playerName.trim();
    
    if (!trimmedPlayerName || !this.room) {
      return;
    }

    this.isJoining = true;
    this.joinRequested.emit({
      roomId: this.room.id,
      playerName: trimmedPlayerName
    });
  }

  /**
   * Handle close/cancel button click
   */
  onClose(): void {
    this.resetForm();
    this.closeRequested.emit();
  }

  /**
   * Handle backdrop click to close modal
   */
  onBackdropClick(event: MouseEvent): void {
    // Only close if clicking directly on the backdrop, not on modal content
    if (event.target === event.currentTarget) {
      this.onClose();
    }
  }

  /**
   * Check if room is full
   */
  isRoomFull(): boolean {
    if (!this.room) {
      return false;
    }
    return this.room.players.length >= this.room.maxPlayers;
  }

  /**
   * Check if user can join the room
   */
  canJoin(): boolean {
    if (!this.room || this.isJoining) {
      return false;
    }
    
    const trimmedPlayerName = this.playerName.trim();
    if (!trimmedPlayerName || trimmedPlayerName.length < 2 || trimmedPlayerName.length > 20) {
      return false;
    }

    return !this.isRoomFull();
  }

  /**
   * Get room status display text
   */
  getRoomStatusText(): string {
    if (!this.room) {
      return '';
    }

    switch (this.room.status) {
      case 'waiting':
        return this.translationService.translate('room.joinRoomModal.statusText.waiting');
      case 'ready':
        return this.translationService.translate('room.joinRoomModal.statusText.ready');
      case 'playing':
        return this.translationService.translate('room.joinRoomModal.statusText.playing');
      case 'finished':
        return this.translationService.translate('room.joinRoomModal.statusText.finished');
      default:
        return this.room.status;
    }
  }

  /**
   * Reset form state
   */
  private resetForm(): void {
    this.playerName = '';
    this.isJoining = false;
  }

  /**
   * Handle escape key press to close modal
   */
  @HostListener('document:keydown.escape')
  handleEscapeKey(): void {
    if (this.isVisible && !this.isJoining) {
      this.onClose();
    }
  }
}
