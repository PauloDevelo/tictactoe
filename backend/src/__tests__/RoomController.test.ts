import request from 'supertest';
import express from 'express';
import roomRoutes from '../routes/roomRoutes';
import { roomService } from '../services/RoomService';

// Create a test Express app
const app = express();
app.use(express.json());
app.use('/api/rooms', roomRoutes);

describe('Room REST API Endpoints', () => {
  beforeEach(() => {
    // Clear all rooms before each test
    const rooms = roomService.getAllRooms();
    rooms.forEach((room) => roomService.deleteRoom(room.id));
  });

  describe('POST /api/rooms', () => {
    it('should create a new room with valid room name', async () => {
      const response = await request(app)
        .post('/api/rooms')
        .send({ roomName: 'Test Room' })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.name).toBe('Test Room');
      expect(response.body.data.id).toBeDefined();
      expect(response.body.data.status).toBe('waiting');
      expect(response.body.data.players).toEqual([]);
    });

    it('should trim whitespace from room name', async () => {
      const response = await request(app)
        .post('/api/rooms')
        .send({ roomName: '  Trimmed Room  ' })
        .expect(201);

      expect(response.body.data.name).toBe('Trimmed Room');
    });

    it('should return 400 if room name is missing', async () => {
      const response = await request(app)
        .post('/api/rooms')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Room name is required');
    });

    it('should return 400 if room name is empty string', async () => {
      const response = await request(app)
        .post('/api/rooms')
        .send({ roomName: '' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Room name is required');
    });

    it('should return 400 if room name is only whitespace', async () => {
      const response = await request(app)
        .post('/api/rooms')
        .send({ roomName: '   ' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Room name is required');
    });

    it('should return 400 if room name is not a string', async () => {
      const response = await request(app)
        .post('/api/rooms')
        .send({ roomName: 123 })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Room name is required');
    });
  });

  describe('GET /api/rooms', () => {
    it('should return empty array when no rooms exist', async () => {
      const response = await request(app)
        .get('/api/rooms')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
      expect(response.body.count).toBe(0);
    });

    it('should return all rooms', async () => {
      // Create test rooms
      roomService.createRoom('ROOM01', 'Room 1');
      roomService.createRoom('ROOM02', 'Room 2');
      roomService.createRoom('ROOM03', 'Room 3');

      const response = await request(app)
        .get('/api/rooms')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(3);
      expect(response.body.count).toBe(3);
      expect(response.body.data[0].name).toBe('Room 1');
      expect(response.body.data[1].name).toBe('Room 2');
      expect(response.body.data[2].name).toBe('Room 3');
    });
  });

  describe('GET /api/rooms/:roomId', () => {
    it('should return room details for existing room', async () => {
      const room = roomService.createRoom('TEST123', 'Test Room');

      const response = await request(app)
        .get('/api/rooms/TEST123')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.id).toBe('TEST123');
      expect(response.body.data.name).toBe('Test Room');
      expect(response.body.data.status).toBe('waiting');
    });

    it('should return 404 for non-existent room', async () => {
      const response = await request(app)
        .get('/api/rooms/NONEXISTENT')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Room not found');
    });

    it('should return room with players if players have joined', async () => {
      const room = roomService.createRoom('TEST456', 'Test Room');
      roomService.joinRoom('TEST456', 'player1', 'Alice');
      roomService.joinRoom('TEST456', 'player2', 'Bob');

      const response = await request(app)
        .get('/api/rooms/TEST456')
        .expect(200);

      expect(response.body.data.players).toHaveLength(2);
      expect(response.body.data.players[0].name).toBe('Alice');
      expect(response.body.data.players[1].name).toBe('Bob');
    });
  });

  describe('DELETE /api/rooms/:roomId', () => {
    it('should delete an existing room', async () => {
      roomService.createRoom('DELETE01', 'Room to Delete');

      const response = await request(app)
        .delete('/api/rooms/DELETE01')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Room deleted successfully');

      // Verify room is deleted
      const room = roomService.getRoom('DELETE01');
      expect(room).toBeUndefined();
    });

    it('should return 404 when deleting non-existent room', async () => {
      const response = await request(app)
        .delete('/api/rooms/NONEXISTENT')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Room not found');
    });

    it('should delete room even if it has players', async () => {
      roomService.createRoom('DELETE02', 'Room with Players');
      roomService.joinRoom('DELETE02', 'player1', 'Alice');

      const response = await request(app)
        .delete('/api/rooms/DELETE02')
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify room is deleted
      const room = roomService.getRoom('DELETE02');
      expect(room).toBeUndefined();
    });
  });

  describe('Integration scenarios', () => {
    it('should handle complete room lifecycle', async () => {
      // Create room
      const createResponse = await request(app)
        .post('/api/rooms')
        .send({ roomName: 'Lifecycle Room' })
        .expect(201);

      const roomId = createResponse.body.data.id;

      // Get room details
      const getResponse = await request(app)
        .get(`/api/rooms/${roomId}`)
        .expect(200);

      expect(getResponse.body.data.name).toBe('Lifecycle Room');

      // List all rooms
      const listResponse = await request(app)
        .get('/api/rooms')
        .expect(200);

      expect(listResponse.body.count).toBe(1);

      // Delete room
      await request(app)
        .delete(`/api/rooms/${roomId}`)
        .expect(200);

      // Verify deletion
      await request(app)
        .get(`/api/rooms/${roomId}`)
        .expect(404);
    });

    it('should handle multiple rooms independently', async () => {
      // Create multiple rooms
      const room1 = await request(app)
        .post('/api/rooms')
        .send({ roomName: 'Room 1' })
        .expect(201);

      const room2 = await request(app)
        .post('/api/rooms')
        .send({ roomName: 'Room 2' })
        .expect(201);

      // List all rooms
      const listResponse = await request(app)
        .get('/api/rooms')
        .expect(200);

      expect(listResponse.body.count).toBe(2);

      // Delete one room
      await request(app)
        .delete(`/api/rooms/${room1.body.data.id}`)
        .expect(200);

      // Verify only one room remains
      const listAfterDelete = await request(app)
        .get('/api/rooms')
        .expect(200);

      expect(listAfterDelete.body.count).toBe(1);
      expect(listAfterDelete.body.data[0].id).toBe(room2.body.data.id);
    });
  });
});
