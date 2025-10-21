import { Component, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, interval } from 'rxjs';
import { takeUntil, switchMap, startWith } from 'rxjs/operators';
import { RoomService, Room } from '../../services/room.service';
import { TranslationService } from '../../services/translation.service';
import { WebSocketService } from '../../services/websocket.service';
import { JoinRoomModalComponent, JoinRoomModalData } from '../join-room-modal/join-room-modal.component';

@Component({
  selector: 'app-room-list',
  standalone: true,
  imports: [CommonModule, JoinRoomModalComponent],
  templateUrl: './room-list.component.html',
  styleUrls: ['./room-list.component.css']
})
export class RoomListComponent implements OnInit, OnDestroy {
  rooms: Room[] = [];
  loading = false;
  error: string | null = null;
  private destroy$ = new Subject<void>();

  // Modal state
  selectedRoom: Room | null = null;
  isModalVisible = false;
  joinError: string | null = null;

  @Output() roomClicked = new EventEmitter<Room>();

  constructor(
    private roomService: RoomService,
    private webSocketService: WebSocketService,
    public readonly translationService: TranslationService
  ) {}

  ngOnInit(): void {
    // Start auto-refresh which will also do the initial load
    this.startAutoRefresh();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load all available rooms
   */
  loadRooms(): void {
    this.loading = true;
    this.error = null;

    this.roomService.getRooms()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (rooms) => {
          this.rooms = rooms;
          this.loading = false;
        },
        error: (err) => {
          this.error = this.translationService.translate('room.list.errors.loadFailed');
          this.loading = false;
          console.error('Error loading rooms:', err);
        }
      });
  }

  /**
   * Auto-refresh rooms every 5 seconds
   */
  private startAutoRefresh(): void {
    interval(5000)
      .pipe(
        startWith(0), // Start immediately
        switchMap(() => {
          this.loading = true;
          return this.roomService.getRooms();
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (rooms) => {
          this.rooms = rooms;
          this.loading = false;
          this.error = null;
        },
        error: (err) => {
          this.error = this.translationService.translate('room.list.errors.loadFailed');
          this.loading = false;
          console.error('Error auto-refreshing rooms:', err);
        }
      });
  }

  /**
   * Get available rooms (waiting or ready status)
   */
  getAvailableRooms(): Room[] {
    return this.rooms.filter(room => this.roomService.isRoomAvailable(room));
  }

  /**
   * Get active rooms (playing status)
   */
  getActiveRooms(): Room[] {
    return this.rooms.filter(room => room.status === 'playing');
  }

  /**
   * Get finished rooms
   */
  getFinishedRooms(): Room[] {
    return this.rooms.filter(room => room.status === 'finished');
  }

  /**
   * Get available slots for a room
   */
  getAvailableSlots(room: Room): number {
    return this.roomService.getAvailableSlots(room);
  }

  /**
   * Check if room is full
   */
  isRoomFull(room: Room): boolean {
    return this.roomService.isRoomFull(room);
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
   * Track rooms by ID for performance
   */
  trackByRoomId(index: number, room: Room): string {
    return room.id;
  }

  /**
   * Handle room click event
   * Opens modal for joining the room if not full
   */
  onRoomClick(room: Room): void {
    if (!this.isRoomFull(room)) {
      this.selectedRoom = room;
      this.isModalVisible = true;
      this.joinError = null;
      this.roomClicked.emit(room);
    }
  }

  /**
   * Handle modal close event
   * Resets modal state
   */
  onModalClose(): void {
    this.isModalVisible = false;
    this.selectedRoom = null;
    this.joinError = null;
  }

  /**
   * Handle join room request from modal
   * Connects to WebSocket and joins the room
   */
  onJoinRequested(data: JoinRoomModalData): void {
    if (!data.roomId || !data.playerName) {
      this.joinError = this.translationService.translate('room.join.errors.invalidData');
      return;
    }

    try {
      // Ensure WebSocket is connected
      if (!this.webSocketService.isConnected()) {
        this.webSocketService.connect();
      }

      // Subscribe to room joined event for success handling
      this.webSocketService.onRoomJoined()
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (event) => {
            console.log('Successfully joined room:', event);
            // Close modal on successful join
            this.onModalClose();
          }
        });

      // Subscribe to error events for error handling
      this.webSocketService.onError()
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (error) => {
            console.error('Error joining room:', error);
            this.joinError = error.message || this.translationService.translate('room.join.errors.joinFailed');
          }
        });

      // Join the room via WebSocket
      this.webSocketService.joinRoom(data.roomId, data.playerName);
    } catch (error) {
      console.error('Error during join process:', error);
      this.joinError = error instanceof Error 
        ? error.message 
        : this.translationService.translate('room.join.errors.joinFailed');
    }
  }
}
