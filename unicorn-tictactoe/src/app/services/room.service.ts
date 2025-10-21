import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface RoomPlayer {
  id: string;
  name: string;
  symbol: 'X' | 'O';
  isReady: boolean;
}

export interface RoomGameState {
  board: ('X' | 'O' | null)[];
  currentTurn: 'X' | 'O';
  status: 'waiting' | 'playing' | 'finished';
  winner: 'X' | 'O' | 'draw' | null;
  winningLine: number[] | null;
}

export interface Room {
  id: string;
  name: string;
  status: 'waiting' | 'ready' | 'playing' | 'finished';
  players: RoomPlayer[];
  maxPlayers: number;
  gameState: RoomGameState;
  createdAt: string;
}

export interface RoomListResponse {
  success: boolean;
  data: Room[];
  count: number;
}

export interface RoomResponse {
  success: boolean;
  data: Room;
}

export interface CreateRoomRequest {
  roomName: string;
}

export interface DeleteRoomResponse {
  success: boolean;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class RoomService {
  private readonly apiUrl = `${environment.wsUrl}/api`;

  constructor(private http: HttpClient) {}

  /**
   * Get all available rooms
   */
  getRooms(): Observable<Room[]> {
    return this.http.get<RoomListResponse>(`${this.apiUrl}/rooms`)
      .pipe(
        map(response => response.data)
      );
  }

  /**
   * Get a specific room by ID
   */
  getRoom(roomId: string): Observable<Room> {
    return this.http.get<RoomResponse>(`${this.apiUrl}/rooms/${roomId}`)
      .pipe(
        map(response => response.data)
      );
  }

  /**
   * Create a new room
   */
  createRoom(roomName: string): Observable<Room> {
    const request: CreateRoomRequest = { roomName };
    return this.http.post<RoomResponse>(`${this.apiUrl}/rooms`, request)
      .pipe(
        map(response => response.data)
      );
  }

  /**
   * Delete a room
   */
  deleteRoom(roomId: string): Observable<void> {
    return this.http.delete<DeleteRoomResponse>(`${this.apiUrl}/rooms/${roomId}`)
      .pipe(
        map(() => undefined)
      );
  }

  /**
   * Check if a room is available for joining (waiting or ready status)
   */
  isRoomAvailable(room: Room): boolean {
    return room.status === 'waiting' || room.status === 'ready';
  }

  /**
   * Check if a room is full (has 2 players)
   */
  isRoomFull(room: Room): boolean {
    return room.players.length >= 2;
  }

  /**
   * Get the number of available slots in a room
   */
  getAvailableSlots(room: Room): number {
    return Math.max(0, 2 - room.players.length);
  }
}
