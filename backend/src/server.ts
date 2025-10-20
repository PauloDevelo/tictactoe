import express from 'express';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { roomService } from './services/RoomService';
import roomRoutes from './routes/roomRoutes';

dotenv.config();

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:4200',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:4200'
}));
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// REST API Routes
app.use('/api/rooms', roomRoutes);

// Track player-to-room mapping for cleanup
const playerRooms = new Map<string, string>();

// Socket.IO connection handling
io.on('connection', (socket: Socket) => {
  console.log(`✅ Client connected: ${socket.id}`);

  // Event: Create Room
  socket.on('room:create', ({ roomName }: { roomName: string }) => {
    try {
      const roomId = generateRoomId();
      const room = roomService.createRoom(roomId, roomName);
      
      socket.emit('room:created', { room });
      console.log(`🏠 Room created: ${roomId} - ${roomName}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create room';
      socket.emit('error', { message: errorMessage });
      console.error(`❌ Error creating room:`, error);
    }
  });

  // Event: Join Room
  socket.on('room:join', ({ roomId, playerName }: { roomId: string; playerName: string }) => {
    try {
      const room = roomService.joinRoom(roomId, socket.id, playerName);
      
      // Join the socket.io room
      socket.join(roomId);
      playerRooms.set(socket.id, roomId);
      
      // Notify the player who joined
      socket.emit('room:joined', { room });
      
      // Notify all players in the room about the update
      io.to(roomId).emit('room:updated', { room });
      
      console.log(`👤 Player ${playerName} (${socket.id}) joined room ${roomId}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to join room';
      socket.emit('error', { message: errorMessage });
      console.error(`❌ Error joining room:`, error);
    }
  });

  // Event: Leave Room
  socket.on('room:leave', ({ roomId }: { roomId: string }) => {
    try {
      const room = roomService.leaveRoom(roomId, socket.id);
      
      // Leave the socket.io room
      socket.leave(roomId);
      playerRooms.delete(socket.id);
      
      // Notify the player who left
      socket.emit('room:left', { roomId });
      
      // Notify remaining players in the room
      if (room.players.length > 0) {
        io.to(roomId).emit('room:updated', { room });
      }
      
      console.log(`👋 Player ${socket.id} left room ${roomId}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to leave room';
      socket.emit('error', { message: errorMessage });
      console.error(`❌ Error leaving room:`, error);
    }
  });

  // Event: Get Room List
  socket.on('room:list', () => {
    try {
      const rooms = roomService.getAllRooms();
      socket.emit('room:list', { rooms });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get room list';
      socket.emit('error', { message: errorMessage });
      console.error(`❌ Error getting room list:`, error);
    }
  });

  // Event: Get Room Details
  socket.on('room:get', ({ roomId }: { roomId: string }) => {
    try {
      const room = roomService.getRoom(roomId);
      if (!room) {
        socket.emit('error', { message: 'Room not found' });
        return;
      }
      socket.emit('room:details', { room });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get room details';
      socket.emit('error', { message: errorMessage });
      console.error(`❌ Error getting room details:`, error);
    }
  });

  // Event: Player Ready
  socket.on('player:ready', ({ roomId, ready }: { roomId: string; ready: boolean }) => {
    try {
      const room = roomService.setPlayerReady(roomId, socket.id, ready);
      
      // Notify all players in the room
      io.to(roomId).emit('room:updated', { room });
      
      console.log(`✋ Player ${socket.id} ready status: ${ready} in room ${roomId}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to set ready status';
      socket.emit('error', { message: errorMessage });
      console.error(`❌ Error setting player ready:`, error);
    }
  });

  // Event: Start Game
  socket.on('game:start', ({ roomId }: { roomId: string }) => {
    try {
      const room = roomService.startGame(roomId);
      
      // Notify all players that the game has started
      io.to(roomId).emit('game:started', { room });
      io.to(roomId).emit('room:updated', { room });
      
      console.log(`🎮 Game started in room ${roomId}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to start game';
      socket.emit('error', { message: errorMessage });
      console.error(`❌ Error starting game:`, error);
    }
  });

  // Event: Make Move
  socket.on('game:move', ({ roomId, position }: { roomId: string; position: number }) => {
    try {
      const room = roomService.makeMove(roomId, socket.id, position);
      
      // Notify all players about the move
      io.to(roomId).emit('game:move', { room, position, playerId: socket.id });
      io.to(roomId).emit('room:updated', { room });
      
      // Check if game is finished
      if (room.gameState.status === 'finished') {
        io.to(roomId).emit('game:finished', { 
          room,
          winner: room.gameState.winner,
          winningLine: room.gameState.winningLine
        });
      }
      
      console.log(`🎯 Move made at position ${position} in room ${roomId}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to make move';
      socket.emit('error', { message: errorMessage });
      console.error(`❌ Error making move:`, error);
    }
  });

  // Event: Reset Game
  socket.on('game:reset', ({ roomId }: { roomId: string }) => {
    try {
      const room = roomService.resetGame(roomId);
      
      // Notify all players that the game has been reset
      io.to(roomId).emit('game:reset', { room });
      io.to(roomId).emit('room:updated', { room });
      
      console.log(`🔄 Game reset in room ${roomId}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to reset game';
      socket.emit('error', { message: errorMessage });
      console.error(`❌ Error resetting game:`, error);
    }
  });

  // Event: Disconnect
  socket.on('disconnect', () => {
    const roomId = playerRooms.get(socket.id);
    
    if (roomId) {
      try {
        const room = roomService.leaveRoom(roomId, socket.id);
        playerRooms.delete(socket.id);
        
        // Notify remaining players
        if (room.players.length > 0) {
          io.to(roomId).emit('room:updated', { room });
          io.to(roomId).emit('player:disconnected', { playerId: socket.id });
        }
        
        console.log(`🔌 Player ${socket.id} disconnected from room ${roomId}`);
      } catch (error) {
        console.error(`❌ Error handling disconnect:`, error);
      }
    }
    
    console.log(`❌ Client disconnected: ${socket.id}`);
  });
});

// Helper function to generate unique room IDs
const generateRoomId = (): string => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

const PORT = process.env.PORT || 3000;

httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Socket.IO ready for connections`);
  console.log(`🌐 CORS enabled for: ${process.env.CORS_ORIGIN || 'http://localhost:4200'}`);
});

export { io, app };
