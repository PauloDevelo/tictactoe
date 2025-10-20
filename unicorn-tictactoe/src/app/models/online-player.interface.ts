import { Player } from './player.model';

export interface OnlinePlayer {
  id: string;
  name: string;
  symbol: Player;
  isReady: boolean;
}
