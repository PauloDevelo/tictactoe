import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, interval } from 'rxjs';
import { takeUntil, switchMap, startWith } from 'rxjs/operators';
import { RoomService, Room } from '../../services/room.service';

@Component({
  selector: 'app-room-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './room-list.component.html',
  styleUrls: ['./room-list.component.css']
})
export class RoomListComponent implements OnInit, OnDestroy {
  rooms: Room[] = [];
  loading = false;
  error: string | null = null;
  private destroy$ = new Subject<void>();

  constructor(private roomService: RoomService) {}

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
          this.error = 'Failed to load rooms. Please try again.';
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
          this.error = 'Failed to load rooms. Please try again.';
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
}
