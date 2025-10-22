# Quick Start Guide - Tic-Tac-Toe Backend Server

## Installation

```bash
npm install
```

## Development

```bash
npm run dev
```

Server will start on `http://localhost:3021` with both REST API and WebSocket support.

## Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- RoomService.test.ts
npm test -- websocket.test.ts
npm test -- RoomController.test.ts
```

## Building

```bash
npm run build
```

Output will be in the `dist/` directory.

## Environment Variables

Create a `.env` file based on `.env.example`:

```env
PORT=3021
CORS_ORIGIN=http://localhost:4200
```

## REST API Endpoints

The server provides REST API endpoints for room management:

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Health check |
| `GET` | `/api/rooms` | Get all rooms |
| `GET` | `/api/rooms/:roomId` | Get room details |
| `POST` | `/api/rooms` | Create a new room |
| `DELETE` | `/api/rooms/:roomId` | Delete a room |

See [REST API Documentation](./REST_API.md) for detailed information.

## WebSocket Events

### Client Events (Client → Server)

| Event | Description | Payload |
|-------|-------------|---------|
| `room:create` | Create a new room | `{ roomName: string }` |
| `room:join` | Join a room | `{ roomId: string, playerName: string }` |
| `room:leave` | Leave a room | `{ roomId: string }` |
| `room:list` | Get all rooms | None |
| `room:get` | Get room details | `{ roomId: string }` |
| `player:ready` | Set ready status | `{ roomId: string, ready: boolean }` |
| `game:start` | Start the game | `{ roomId: string }` |
| `game:move` | Make a move | `{ roomId: string, position: number }` |
| `game:reset` | Reset the game | `{ roomId: string }` |

### Server Events (Server → Client)

| Event | Description | Payload |
|-------|-------------|---------|
| `room:created` | Room created | `{ room: Room }` |
| `room:joined` | Player joined | `{ room: Room }` |
| `room:left` | Player left | `{ roomId: string }` |
| `room:updated` | Room state changed | `{ room: Room }` |
| `room:list` | List of rooms | `{ rooms: Room[] }` |
| `room:details` | Room details | `{ room: Room }` |
| `game:started` | Game started | `{ room: Room }` |
| `game:move` | Move made | `{ room: Room, position: number, playerId: string }` |
| `game:finished` | Game ended | `{ room: Room, winner, winningLine }` |
| `game:reset` | Game reset | `{ room: Room }` |
| `player:disconnected` | Player disconnected | `{ playerId: string }` |
| `error` | Error occurred | `{ message: string }` |

## Example Client Code

```typescript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3021');

// Create a room
socket.emit('room:create', { roomName: 'My Game' });

socket.on('room:created', ({ room }) => {
  console.log('Room created:', room.id);
});

// Join a room
socket.emit('room:join', { 
  roomId: 'ABC123', 
  playerName: 'Player 1' 
});

socket.on('room:joined', ({ room }) => {
  console.log('Joined room:', room);
});

// Set ready
socket.emit('player:ready', { roomId: 'ABC123', ready: true });

// Start game
socket.emit('game:start', { roomId: 'ABC123' });

// Make a move
socket.emit('game:move', { roomId: 'ABC123', position: 4 });

// Listen for updates
socket.on('room:updated', ({ room }) => {
  console.log('Room updated:', room);
});

socket.on('game:move', ({ room, position, playerId }) => {
  console.log('Move made:', position);
});

socket.on('game:finished', ({ winner, winningLine }) => {
  console.log('Game finished! Winner:', winner);
});

socket.on('error', ({ message }) => {
  console.error('Error:', message);
});
```

## Architecture

```
backend/
├── src/
│   ├── models/           # Data models (immutable)
│   │   ├── GameState.ts  # Game state logic
│   │   ├── Player.ts     # Player model
│   │   └── Room.ts       # Room model
│   ├── services/         # Business logic
│   │   └── RoomService.ts # Room management
│   ├── controllers/      # REST API controllers
│   │   └── RoomController.ts
│   ├── routes/           # REST API routes
│   │   └── roomRoutes.ts
│   ├── __tests__/        # Test files
│   │   ├── RoomService.test.ts
│   │   ├── RoomController.test.ts
│   │   └── websocket.test.ts
│   └── server.ts         # Main server (REST + WebSocket)
├── .env.example          # Environment template
├── package.json
└── tsconfig.json
```

## Key Features

✅ REST API for room management
✅ Real-time multiplayer synchronization via WebSocket
✅ Room-based game management
✅ Automatic player cleanup on disconnect
✅ Comprehensive error handling
✅ Full TypeScript support
✅ Functional programming patterns
✅ Immutable state management
✅ 100% test coverage

## Troubleshooting

### Port already in use
```bash
# Change PORT in .env file
PORT=3001
```

### CORS errors
```bash
# Update CORS_ORIGIN in .env file
CORS_ORIGIN=http://localhost:4200
```

### Connection issues
- Ensure server is running
- Check firewall settings
- Verify client is connecting to correct URL

## Documentation

- [REST API Documentation](./REST_API.md)
- [WebSocket API Documentation](./WEBSOCKET_API.md)
- [Implementation Summary](./IMPLEMENTATION_SUMMARY.md)

## Support

For issues or questions, check the test files for usage examples.
