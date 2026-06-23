import { OnlinePlayer } from './online-player.interface';
import { GameState } from './game-state.model';
import { RoomStatus } from './room-status.enum';
import { GameType } from './game-type.model';

export interface Room {
  id: string;
  name: string;
  players: OnlinePlayer[];
  maxPlayers: number;
  gameState: GameState;
  status: RoomStatus;
  createdAt: Date;
  gameType: GameType;
}
