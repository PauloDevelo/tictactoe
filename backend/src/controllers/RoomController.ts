import { Request, Response } from 'express';
import { roomService } from '../services/RoomService';

export class RoomController {
  // GET /api/rooms - Get all available rooms
  getAllRooms(req: Request, res: Response): void {
    try {
      const rooms = roomService.getAllRooms();
      res.json({
        success: true,
        data: rooms,
        count: rooms.length,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch rooms';
      res.status(500).json({
        success: false,
        error: message,
      });
    }
  }

  // GET /api/rooms/:roomId - Get specific room details
  getRoomById(req: Request, res: Response): void {
    try {
      const { roomId } = req.params;
      const room = roomService.getRoom(roomId);

      if (!room) {
        res.status(404).json({
          success: false,
          error: 'Room not found',
        });
        return;
      }

      res.json({
        success: true,
        data: room,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch room';
      res.status(500).json({
        success: false,
        error: message,
      });
    }
  }

  // POST /api/rooms - Create a new room
  createRoom(req: Request, res: Response): void {
    try {
      const { roomName } = req.body;

      if (!roomName || typeof roomName !== 'string' || roomName.trim() === '') {
        res.status(400).json({
          success: false,
          error: 'Room name is required and must be a non-empty string',
        });
        return;
      }

      const roomId = generateRoomId();
      const room = roomService.createRoom(roomId, roomName.trim());

      res.status(201).json({
        success: true,
        data: room,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create room';
      res.status(500).json({
        success: false,
        error: message,
      });
    }
  }

  // DELETE /api/rooms/:roomId - Delete a room
  deleteRoom(req: Request, res: Response): void {
    try {
      const { roomId } = req.params;
      const room = roomService.getRoom(roomId);

      if (!room) {
        res.status(404).json({
          success: false,
          error: 'Room not found',
        });
        return;
      }

      const deleted = roomService.deleteRoom(roomId);

      if (deleted) {
        res.json({
          success: true,
          message: 'Room deleted successfully',
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Failed to delete room',
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete room';
      res.status(500).json({
        success: false,
        error: message,
      });
    }
  }
}

// Helper function to generate unique room IDs
const generateRoomId = (): string => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

export const roomController = new RoomController();
