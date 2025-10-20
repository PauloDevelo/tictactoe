import { Router } from 'express';
import { roomController } from '../controllers/RoomController';

const router = Router();

// GET /api/rooms - Get all available rooms
router.get('/', (req, res) => roomController.getAllRooms(req, res));

// GET /api/rooms/:roomId - Get specific room details
router.get('/:roomId', (req, res) => roomController.getRoomById(req, res));

// POST /api/rooms - Create a new room
router.post('/', (req, res) => roomController.createRoom(req, res));

// DELETE /api/rooms/:roomId - Delete a room
router.delete('/:roomId', (req, res) => roomController.deleteRoom(req, res));

export default router;
