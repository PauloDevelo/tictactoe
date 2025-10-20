import { Server } from 'socket.io';
import { io as Client, Socket as ClientSocket } from 'socket.io-client';
import { createServer } from 'http';
import { AddressInfo } from 'net';

describe('WebSocket Integration', () => {
  let io: Server;
  let serverSocket: any;
  let clientSocket: ClientSocket;
  let httpServer: any;
  let port: number;

  beforeAll((done) => {
    httpServer = createServer();
    io = new Server(httpServer);
    
    httpServer.listen(() => {
      port = (httpServer.address() as AddressInfo).port;
      done();
    });
  });

  afterAll((done) => {
    io.close();
    httpServer.close(done);
  });

  beforeEach((done) => {
    clientSocket = Client(`http://localhost:${port}`);
    
    io.on('connection', (socket) => {
      serverSocket = socket;
    });
    
    clientSocket.on('connect', done);
  });

  afterEach(() => {
    clientSocket.close();
    if (serverSocket) {
      serverSocket.disconnect();
    }
  });

  describe('Connection', () => {
    it('should establish connection', (done) => {
      expect(clientSocket.connected).toBe(true);
      done();
    });

    it('should receive connection event on server', (done) => {
      expect(serverSocket).toBeDefined();
      expect(serverSocket.id).toBeDefined();
      done();
    });
  });

  describe('Event Communication', () => {
    it('should emit and receive custom events', (done) => {
      const testData = { message: 'test' };
      
      serverSocket.on('test:event', (data: any) => {
        expect(data).toEqual(testData);
        serverSocket.emit('test:response', { received: true });
      });

      clientSocket.on('test:response', (data: any) => {
        expect(data.received).toBe(true);
        done();
      });

      clientSocket.emit('test:event', testData);
    });

    it('should handle error events', (done) => {
      const errorMessage = 'Test error';
      
      clientSocket.on('error', (data: any) => {
        expect(data.message).toBe(errorMessage);
        done();
      });

      serverSocket.emit('error', { message: errorMessage });
    });
  });

  describe('Room Events', () => {
    it('should handle room:create event structure', (done) => {
      serverSocket.on('room:create', (data: any) => {
        expect(data).toHaveProperty('roomName');
        serverSocket.emit('room:created', { 
          room: { 
            id: 'TEST123', 
            name: data.roomName,
            players: [],
            maxPlayers: 2,
            status: 'waiting'
          } 
        });
      });

      clientSocket.on('room:created', (data: any) => {
        expect(data.room).toBeDefined();
        expect(data.room.id).toBe('TEST123');
        done();
      });

      clientSocket.emit('room:create', { roomName: 'Test Room' });
    });

    it('should handle room:join event structure', (done) => {
      serverSocket.on('room:join', (data: any) => {
        expect(data).toHaveProperty('roomId');
        expect(data).toHaveProperty('playerName');
        serverSocket.emit('room:joined', { 
          room: { 
            id: data.roomId,
            players: [{ id: serverSocket.id, name: data.playerName }]
          } 
        });
      });

      clientSocket.on('room:joined', (data: any) => {
        expect(data.room).toBeDefined();
        expect(data.room.players).toHaveLength(1);
        done();
      });

      clientSocket.emit('room:join', { roomId: 'TEST123', playerName: 'Player1' });
    });
  });

  describe('Game Events', () => {
    it('should handle game:move event structure', (done) => {
      serverSocket.on('game:move', (data: any) => {
        expect(data).toHaveProperty('roomId');
        expect(data).toHaveProperty('position');
        expect(data.position).toBeGreaterThanOrEqual(0);
        expect(data.position).toBeLessThan(9);
        done();
      });

      clientSocket.emit('game:move', { roomId: 'TEST123', position: 4 });
    });

    it('should handle game:start event structure', (done) => {
      serverSocket.on('game:start', (data: any) => {
        expect(data).toHaveProperty('roomId');
        serverSocket.emit('game:started', { 
          room: { 
            id: data.roomId,
            status: 'playing'
          } 
        });
      });

      clientSocket.on('game:started', (data: any) => {
        expect(data.room.status).toBe('playing');
        done();
      });

      clientSocket.emit('game:start', { roomId: 'TEST123' });
    });

    it('should handle game:reset event structure', (done) => {
      serverSocket.on('game:reset', (data: any) => {
        expect(data).toHaveProperty('roomId');
        serverSocket.emit('game:reset', { 
          room: { 
            id: data.roomId,
            status: 'waiting',
            gameState: {
              board: Array(9).fill(null),
              currentTurn: 'X',
              status: 'waiting'
            }
          } 
        });
      });

      clientSocket.on('game:reset', (data: any) => {
        expect(data.room.status).toBe('waiting');
        expect(data.room.gameState.board).toEqual(Array(9).fill(null));
        done();
      });

      clientSocket.emit('game:reset', { roomId: 'TEST123' });
    });
  });

  describe('Disconnect Handling', () => {
    it('should handle client disconnect', (done) => {
      serverSocket.on('disconnect', () => {
        done();
      });

      clientSocket.disconnect();
    });
  });
});
