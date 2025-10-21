# WebSocket API Documentation

## Overview

This document describes the WebSocket API for the Tic-Tac-Toe multiplayer game server. The server uses Socket.IO for real-time bidirectional communication.

## Connection

**Endpoint:** `ws://localhost:3021` (or configured PORT)

**CORS:** Configured to accept connections from `http://localhost:4200` (or configured CORS_ORIGIN)

## Events

### Client → Server Events

#### `room:create`
Create a new game room.

**Payload:**
```typescript
{
  roomName: string
}
```

**Response Events:**
- `room:created` - On success
- `error` - On failure

---

#### `room:join`
Join an existing game room.

**Payload:**
```typescript
{
  roomId: string,
  playerName: string
}
```

**Response Events:**
- `room:joined` - Sent to the joining player
- `room:updated` - Broadcast to all players in the room
- `error` - On failure (room full, room not found, etc.)

---

#### `room:leave`
Leave the current game room.

**Payload:**
```typescript
{
  roomId: string
}
```

**Response Events:**
- `room:left` - Sent to the leaving player
- `room:updated` - Broadcast to remaining players
- `error` - On failure

---

#### `room:list`
Get a list of all available rooms.

**Payload:** None

**Response Events:**
- `room:list` - Returns array of rooms
- `error` - On failure

---

#### `room:get`
Get details of a specific room.

**Payload:**
```typescript
{
  roomId: string
}
```

**Response Events:**
- `room:details` - Returns room details
- `error` - On failure (room not found)

---

#### `player:ready`
Set player ready status.

**Payload:**
```typescript
{
  roomId: string,
  ready: boolean
}
```

**Response Events:**
- `room:updated` - Broadcast to all players in the room
- `error` - On failure

---

#### `game:start`
Start the game (only when all players are ready).

**Payload:**
```typescript
{
  roomId: string
}
```

**Response Events:**
- `game:started` - Broadcast to all players
- `room:updated` - Broadcast to all players
- `error` - On failure (not all players ready)

---

#### `game:move`
Make a move in the game.

**Payload:**
```typescript
{
  roomId: string,
  position: number  // 0-8, representing board position
}
```

**Response Events:**
- `game:move` - Broadcast to all players
- `room:updated` - Broadcast to all players
- `game:finished` - Broadcast if game ends
- `error` - On failure (invalid move, not your turn, etc.)

---

#### `game:reset`
Reset the game to initial state.

**Payload:**
```typescript
{
  roomId: string
}
```

**Response Events:**
- `game:reset` - Broadcast to all players
- `room:updated` - Broadcast to all players
- `error` - On failure

---

### Server → Client Events

#### `room:created`
Emitted when a room is successfully created.

**Payload:**
```typescript
{
  room: Room
}
```

---

#### `room:joined`
Emitted to the player who successfully joined a room.

**Payload:**
```typescript
{
  room: Room
}
```

---

#### `room:left`
Emitted to the player who left a room.

**Payload:**
```typescript
{
  roomId: string
}
```

---

#### `room:updated`
Broadcast to all players when room state changes.

**Payload:**
```typescript
{
  room: Room
}
```

---

#### `room:list`
Response to `room:list` request.

**Payload:**
```typescript
{
  rooms: Room[]
}
```

---

#### `room:details`
Response to `room:get` request.

**Payload:**
```typescript
{
  room: Room
}
```

---

#### `game:started`
Broadcast when a game starts.

**Payload:**
```typescript
{
  room: Room
}
```

---

#### `game:move`
Broadcast when a player makes a move.

**Payload:**
```typescript
{
  room: Room,
  position: number,
  playerId: string
}
```

---

#### `game:finished`
Broadcast when a game ends.

**Payload:**
```typescript
{
  room: Room,
  winner: 'X' | 'O' | 'draw' | null,
  winningLine: number[] | null
}
```

---

#### `game:reset`
Broadcast when a game is reset.

**Payload:**
```typescript
{
  room: Room
}
```

---

#### `player:disconnected`
Broadcast when a player disconnects.

**Payload:**
```typescript
{
  playerId: string
}
```

---

#### `error`
Emitted when an error occurs.

**Payload:**
```typescript
{
  message: string
}
```

---

## Data Types

### Room
```typescript
interface Room {
  id: string;
  name: string;
  players: Player[];
  maxPlayers: number;
  gameState: GameState;
  status: 'waiting' | 'ready' | 'playing' | 'finished';
  createdAt: Date;
}
```

### Player
```typescript
interface Player {
  id: string;
  name: string;
  symbol: 'X' | 'O';
  isReady: boolean;
}
```

### GameState
```typescript
interface GameState {
  board: CellValue[];  // Array of 9 cells
  currentTurn: 'X' | 'O';
  status: 'waiting' | 'playing' | 'finished';
  winner: 'X' | 'O' | 'draw' | null;
  winningLine: number[] | null;
}
```

### CellValue
```typescript
type CellValue = 'X' | 'O' | null;
```

---

## Game Flow

1. **Create Room**: Player creates a room using `room:create`
2. **Join Room**: Players join using `room:join` (max 2 players)
3. **Ready Up**: Both players set ready status using `player:ready`
4. **Start Game**: When both ready, any player can emit `game:start`
5. **Play**: Players alternate making moves using `game:move`
6. **Game End**: Game ends when there's a winner or draw
7. **Reset**: Players can reset using `game:reset` to play again

---

## Error Handling

All errors are emitted via the `error` event with a descriptive message. Common errors include:

- Room not found
- Room is full
- Player not found
- Not your turn
- Invalid move
- Game not in progress
- Not all players ready

---

## Connection Management

- When a player disconnects, they are automatically removed from their room
- If a room becomes empty, it is automatically deleted
- Remaining players are notified via `player:disconnected` and `room:updated` events

---

## Example Usage

### Creating and Joining a Room

```typescript
// Client 1: Create room
socket.emit('room:create', { roomName: 'My Game' });

socket.on('room:created', ({ room }) => {
  console.log('Room created:', room.id);
});

// Client 2: Join room
socket.emit('room:join', { 
  roomId: 'ABC123', 
  playerName: 'Player 2' 
});

socket.on('room:joined', ({ room }) => {
  console.log('Joined room:', room);
});
```

### Starting a Game

```typescript
// Both players ready up
socket.emit('player:ready', { roomId: 'ABC123', ready: true });

// Listen for room updates
socket.on('room:updated', ({ room }) => {
  if (room.status === 'ready') {
    // All players ready, can start game
    socket.emit('game:start', { roomId: 'ABC123' });
  }
});

socket.on('game:started', ({ room }) => {
  console.log('Game started!');
});
```

### Making Moves

```typescript
socket.emit('game:move', { roomId: 'ABC123', position: 4 });

socket.on('game:move', ({ room, position, playerId }) => {
  console.log(`Player ${playerId} moved at position ${position}`);
  // Update UI with new board state
});

socket.on('game:finished', ({ room, winner, winningLine }) => {
  console.log('Game finished! Winner:', winner);
});
```

---

## Testing

The WebSocket API includes comprehensive integration tests. Run tests with:

```bash
npm test
```

Tests cover:
- Connection establishment
- Event communication
- Room management
- Game flow
- Error handling
- Disconnect handling
