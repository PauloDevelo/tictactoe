# REST API Documentation

This document describes the REST API endpoints available in the Tic-Tac-Toe backend server.

## Base URL

```
http://localhost:3000/api
```

## Endpoints

### Health Check

#### GET /health

Check if the server is running.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

### Room Management

#### GET /api/rooms

Get a list of all available rooms.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "ABC123",
      "name": "Game Room 1",
      "status": "waiting",
      "players": [],
      "gameState": {
        "board": [null, null, null, null, null, null, null, null, null],
        "currentTurn": "X",
        "status": "waiting",
        "winner": null,
        "winningLine": null
      },
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "count": 1
}
```

**Status Codes:**
- `200 OK` - Success
- `500 Internal Server Error` - Server error

---

#### GET /api/rooms/:roomId

Get details of a specific room.

**Parameters:**
- `roomId` (string, required) - The unique room identifier

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "ABC123",
    "name": "Game Room 1",
    "status": "waiting",
    "players": [
      {
        "id": "player1",
        "name": "Alice",
        "symbol": "X",
        "isReady": false
      }
    ],
    "gameState": {
      "board": [null, null, null, null, null, null, null, null, null],
      "currentTurn": "X",
      "status": "waiting",
      "winner": null,
      "winningLine": null
    },
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Status Codes:**
- `200 OK` - Success
- `404 Not Found` - Room not found
- `500 Internal Server Error` - Server error

---

#### POST /api/rooms

Create a new room.

**Request Body:**
```json
{
  "roomName": "My Game Room"
}
```

**Validation:**
- `roomName` must be a non-empty string
- Whitespace is automatically trimmed

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "ABC123",
    "name": "My Game Room",
    "status": "waiting",
    "players": [],
    "gameState": {
      "board": [null, null, null, null, null, null, null, null, null],
      "currentTurn": "X",
      "status": "waiting",
      "winner": null,
      "winningLine": null
    },
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Status Codes:**
- `201 Created` - Room created successfully
- `400 Bad Request` - Invalid room name
- `500 Internal Server Error` - Server error

**Error Response (400):**
```json
{
  "success": false,
  "error": "Room name is required and must be a non-empty string"
}
```

---

#### DELETE /api/rooms/:roomId

Delete a room.

**Parameters:**
- `roomId` (string, required) - The unique room identifier

**Response:**
```json
{
  "success": true,
  "message": "Room deleted successfully"
}
```

**Status Codes:**
- `200 OK` - Room deleted successfully
- `404 Not Found` - Room not found
- `500 Internal Server Error` - Server error

**Error Response (404):**
```json
{
  "success": false,
  "error": "Room not found"
}
```

---

## Room Status Values

- `waiting` - Room is waiting for players or for players to be ready
- `ready` - All players are ready, game can start
- `playing` - Game is in progress
- `finished` - Game has ended

## Game State Status Values

- `waiting` - Game has not started
- `playing` - Game is in progress
- `finished` - Game has ended

## Player Symbols

- `X` - First player
- `O` - Second player

## Error Response Format

All error responses follow this format:

```json
{
  "success": false,
  "error": "Error message describing what went wrong"
}
```

## CORS Configuration

The API supports CORS and is configured to accept requests from:
- `http://localhost:4200` (default Angular development server)
- Custom origin can be set via `CORS_ORIGIN` environment variable

## Example Usage

### Create a Room

```bash
curl -X POST http://localhost:3000/api/rooms \
  -H "Content-Type: application/json" \
  -d '{"roomName": "My Game Room"}'
```

### Get All Rooms

```bash
curl http://localhost:3000/api/rooms
```

### Get Room Details

```bash
curl http://localhost:3000/api/rooms/ABC123
```

### Delete a Room

```bash
curl -X DELETE http://localhost:3000/api/rooms/ABC123
```

## Notes

- Room IDs are automatically generated as 6-character uppercase alphanumeric strings
- Rooms are stored in memory and will be lost when the server restarts
- For real-time game interactions (joining, playing, etc.), use the WebSocket API (see WEBSOCKET_API.md)
- The REST API is primarily for room discovery and management
- Game logic and player interactions are handled via WebSocket events
