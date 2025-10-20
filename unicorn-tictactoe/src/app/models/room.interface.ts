import { OnlinePlayer } from './online-player.interface';
import { GameState } from './game-state.model';
import { RoomStatus } from './room-status.enum';

export interface Room {
  id: string;
  name: string;
  players: OnlinePlayer[];
  maxPlayers: number;
  gameState: GameState;
  status: RoomStatus;
  createdAt: Date;
}
