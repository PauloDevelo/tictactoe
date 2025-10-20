export interface Player {
  id: string;
  name: string;
  symbol: 'X' | 'O';
  isReady: boolean;
}

export const createPlayer = (
  id: string,
  name: string,
  symbol: 'X' | 'O'
): Player => ({
  id,
  name,
  symbol,
  isReady: false,
});

export const setPlayerReady = (player: Player, ready: boolean): Player => ({
  ...player,
  isReady: ready,
});
