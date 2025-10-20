# 🛠️ Developer Guide

Comprehensive guide for developers working on the Tic-Tac-Toe multiplayer game platform.

## 📖 Table of Contents

1. [Getting Started](#getting-started)
2. [Architecture Overview](#architecture-overview)
3. [Frontend Development](#frontend-development)
4. [Backend Development](#backend-development)
5. [Testing](#testing)
6. [API Reference](#api-reference)
7. [Deployment](#deployment)
8. [Contributing](#contributing)
9. [Best Practices](#best-practices)

## 🚀 Getting Started

### Prerequisites

- **Node.js**: 18.x or higher
- **npm**: 9.x or higher
- **Git**: Latest version
- **Code Editor**: VS Code recommended
- **Browser**: Chrome/Firefox with DevTools

### Initial Setup

```bash
# Clone the repository
git clone <repository-url>
cd tictactoe

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../unicorn-tictactoe
npm install
```

### Development Environment

**Backend:**
```bash
cd backend
npm run dev
# Server runs on http://localhost:3000
# Hot-reload enabled with nodemon
```

**Frontend:**
```bash
cd unicorn-tictactoe
npm start
# App runs on http://localhost:4200
# Hot-reload enabled with Angular CLI
```

### Environment Configuration

**Backend** - Create `backend/.env`:
```env
PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:4200
```

**Frontend** - Edit `unicorn-tictactoe/src/environments/environment.ts`:
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000'
};
```

## 🏗️ Architecture Overview

### System Architecture

```
┌─────────────────┐         ┌─────────────────┐
│  Angular App    │◄───────►│   Node.js API   │
│  (Frontend)     │  HTTP   │   (Backend)     │
│                 │ WebSocket│                 │
└─────────────────┘         └─────────────────┘
        │                            │
        │                            │
        ▼                            ▼
┌─────────────────┐         ┌─────────────────┐
│  Browser        │         │  In-Memory      │
│  LocalStorage   │         │  Room Store     │
└─────────────────┘         └─────────────────┘
```

### Technology Stack

**Frontend:**
- **Framework**: Angular 20.3 (standalone components)
- **Language**: TypeScript 5.9
- **State Management**: RxJS BehaviorSubjects
- **Real-time**: Socket.IO Client 4.8
- **Testing**: Jasmine + Karma
- **Build**: Angular CLI with esbuild

**Backend:**
- **Runtime**: Node.js 20.x
- **Framework**: Express 4.18
- **Real-time**: Socket.IO 4.6
- **Language**: TypeScript 5.3
- **Testing**: Jest 29.7
- **Build**: TypeScript Compiler

### Design Patterns

**Frontend:**
- **Component-based architecture** - Modular, reusable components
- **Service layer** - Business logic separation
- **Observable pattern** - Reactive state management
- **Dependency injection** - Angular's DI system

**Backend:**
- **MVC pattern** - Models, Controllers, Services
- **Functional programming** - Immutable state, pure functions
- **Event-driven** - Socket.IO event handlers
- **Singleton services** - Shared state management

## 🎨 Frontend Development

### Project Structure

```
unicorn-tictactoe/
├── src/
│   ├── app/
│   │   ├── components/
│   │   │   ├── game-board/          # Main game grid
│   │   │   ├── game-cell/           # Individual cell
│   │   │   ├── game-controls/       # Status & reset
│   │   │   ├── score-board/         # Score display
│   │   │   ├── room-list/           # Available rooms
│   │   │   ├── room-create/         # Create room form
│   │   │   ├── room-join/           # Join room form
│   │   │   ├── game-room/           # Multiplayer game
│   │   │   └── home/                # Landing page
│   │   ├── models/
│   │   │   ├── player.model.ts      # Player enum
│   │   │   ├── cell.model.ts        # Cell type
│   │   │   ├── game-status.enum.ts  # Game states
│   │   │   ├── room.model.ts        # Room interface
│   │   │   └── game-state.model.ts  # Game state
│   │   ├── services/
│   │   │   ├── game.service.ts      # Local game logic
│   │   │   ├── websocket.service.ts # Socket.IO client
│   │   │   └── room.service.ts      # Room management
│   │   └── app.ts                   # Root component
│   ├── environments/
│   │   ├── environment.ts           # Dev config
│   │   └── environment.prod.ts      # Prod config
│   └── styles.css                   # Global styles
├── angular.json                     # Angular config
├── tsconfig.json                    # TypeScript config
└── package.json
```

### Key Components

#### GameBoard Component
```typescript
@Component({
  selector: 'app-game-board',
  standalone: true,
  imports: [GameCellComponent],
  templateUrl: './game-board.component.html'
})
export class GameBoardComponent {
  cells$ = this.gameService.cells$;
  
  constructor(private gameService: GameService) {}
  
  onCellClick(index: number): void {
    this.gameService.makeMove(index);
  }
}
```

#### GameService (State Management)
```typescript
@Injectable({ providedIn: 'root' })
export class GameService {
  private cellsSubject = new BehaviorSubject<CellValue[]>(
    Array(9).fill(null)
  );
  cells$ = this.cellsSubject.asObservable();
  
  makeMove(index: number): void {
    const cells = [...this.cellsSubject.value];
    if (cells[index] === null && !this.isGameOver()) {
      cells[index] = this.currentPlayer;
      this.cellsSubject.next(cells);
      this.switchPlayer();
      this.checkWinner();
    }
  }
}
```

### WebSocket Integration

```typescript
@Injectable({ providedIn: 'root' })
export class WebsocketService {
  private socket: Socket;
  
  constructor() {
    this.socket = io(environment.apiUrl);
    this.setupListeners();
  }
  
  // Emit events
  createRoom(roomName: string): void {
    this.socket.emit('room:create', { roomName });
  }
  
  joinRoom(roomId: string, playerName: string): void {
    this.socket.emit('room:join', { roomId, playerName });
  }
  
  makeMove(roomId: string, position: number): void {
    this.socket.emit('game:move', { roomId, position });
  }
  
  // Listen for events
  private setupListeners(): void {
    this.socket.on('room:created', (data) => {
      this.roomCreated$.next(data.room);
    });
    
    this.socket.on('room:updated', (data) => {
      this.roomUpdated$.next(data.room);
    });
    
    this.socket.on('game:move', (data) => {
      this.gameMove$.next(data);
    });
  }
}
```

### Styling Guidelines

**CSS Variables:**
```css
:root {
  --unicorn-pink: #FF69B4;
  --cat-purple: #9370DB;
  --background: #FFF0F5;
  --text-dark: #4A4A4A;
  --border-color: #E0E0E0;
  --success-green: #4CAF50;
  --error-red: #F44336;
}
```

**Component Styles:**
- Use `:host` for component root styling
- Scoped styles by default (no global pollution)
- BEM naming for complex components
- Responsive breakpoints: 360px, 480px, 768px, 1024px

### Accessibility Implementation

**ARIA Labels:**
```html
<button 
  [attr.aria-label]="'Cell ' + (index + 1) + ', ' + cellState"
  [attr.aria-pressed]="cell !== null"
  role="button"
  tabindex="0">
  {{ cell }}
</button>
```

**Live Regions:**
```html
<div 
  role="status" 
  aria-live="polite" 
  aria-atomic="true"
  class="sr-only">
  {{ statusMessage }}
</div>
```

**Keyboard Navigation:**
```typescript
@HostListener('keydown', ['$event'])
handleKeyDown(event: KeyboardEvent): void {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    this.onCellClick();
  }
}
```

## ⚙️ Backend Development

### Project Structure

```
backend/
├── src/
│   ├── models/
│   │   ├── GameState.ts      # Game logic & state
│   │   ├── Player.ts         # Player model
│   │   └── Room.ts           # Room model
│   ├── services/
│   │   └── RoomService.ts    # Room management
│   ├── controllers/
│   │   └── RoomController.ts # REST API handlers
│   ├── routes/
│   │   └── roomRoutes.ts     # Express routes
│   ├── __tests__/
│   │   ├── RoomService.test.ts
│   │   ├── RoomController.test.ts
│   │   └── websocket.test.ts
│   └── server.ts             # Main entry point
├── deployment/               # Production scripts
├── .env.example
├── tsconfig.json
└── package.json
```

### Core Models

#### GameState Model
```typescript
export class GameState {
  constructor(
    public board: CellValue[] = Array(9).fill(null),
    public currentTurn: PlayerSymbol = 'X',
    public status: GameStatus = 'waiting',
    public winner: PlayerSymbol | 'draw' | null = null,
    public winningLine: number[] | null = null
  ) {}
  
  makeMove(position: number, symbol: PlayerSymbol): GameState {
    // Immutable update
    const newBoard = [...this.board];
    newBoard[position] = symbol;
    
    const winner = this.checkWinner(newBoard);
    const status = winner ? 'finished' : 'playing';
    const nextTurn = symbol === 'X' ? 'O' : 'X';
    
    return new GameState(
      newBoard,
      nextTurn,
      status,
      winner,
      this.getWinningLine(newBoard)
    );
  }
  
  private checkWinner(board: CellValue[]): PlayerSymbol | 'draw' | null {
    // Win condition logic
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
      [0, 4, 8], [2, 4, 6]             // Diagonals
    ];
    
    for (const [a, b, c] of lines) {
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return board[a] as PlayerSymbol;
      }
    }
    
    return board.every(cell => cell !== null) ? 'draw' : null;
  }
}
```

#### Room Model
```typescript
export class Room {
  constructor(
    public id: string,
    public name: string,
    public players: Player[] = [],
    public maxPlayers: number = 2,
    public gameState: GameState = new GameState(),
    public status: RoomStatus = 'waiting',
    public createdAt: Date = new Date()
  ) {}
  
  addPlayer(playerId: string, playerName: string): Room {
    if (this.players.length >= this.maxPlayers) {
      throw new Error('Room is full');
    }
    
    const symbol: PlayerSymbol = this.players.length === 0 ? 'X' : 'O';
    const newPlayer = new Player(playerId, playerName, symbol);
    
    return new Room(
      this.id,
      this.name,
      [...this.players, newPlayer],
      this.maxPlayers,
      this.gameState,
      this.status,
      this.createdAt
    );
  }
}
```

### RoomService (Business Logic)

```typescript
class RoomService {
  private rooms = new Map<string, Room>();
  
  createRoom(roomId: string, roomName: string): Room {
    const room = new Room(roomId, roomName);
    this.rooms.set(roomId, room);
    return room;
  }
  
  joinRoom(roomId: string, playerId: string, playerName: string): Room {
    const room = this.getRoom(roomId);
    if (!room) throw new Error('Room not found');
    
    const updatedRoom = room.addPlayer(playerId, playerName);
    this.rooms.set(roomId, updatedRoom);
    return updatedRoom;
  }
  
  makeMove(roomId: string, playerId: string, position: number): Room {
    const room = this.getRoom(roomId);
    if (!room) throw new Error('Room not found');
    
    const player = room.players.find(p => p.id === playerId);
    if (!player) throw new Error('Player not in room');
    
    if (room.gameState.currentTurn !== player.symbol) {
      throw new Error('Not your turn');
    }
    
    const newGameState = room.gameState.makeMove(position, player.symbol);
    const updatedRoom = new Room(
      room.id,
      room.name,
      room.players,
      room.maxPlayers,
      newGameState,
      newGameState.status === 'finished' ? 'finished' : room.status,
      room.createdAt
    );
    
    this.rooms.set(roomId, updatedRoom);
    return updatedRoom;
  }
}
```

### WebSocket Event Handlers

```typescript
io.on('connection', (socket: Socket) => {
  console.log(`Client connected: ${socket.id}`);
  
  // Create room
  socket.on('room:create', ({ roomName }) => {
    try {
      const roomId = generateRoomId();
      const room = roomService.createRoom(roomId, roomName);
      socket.emit('room:created', { room });
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  });
  
  // Join room
  socket.on('room:join', ({ roomId, playerName }) => {
    try {
      const room = roomService.joinRoom(roomId, socket.id, playerName);
      socket.join(roomId);
      socket.emit('room:joined', { room });
      io.to(roomId).emit('room:updated', { room });
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  });
  
  // Make move
  socket.on('game:move', ({ roomId, position }) => {
    try {
      const room = roomService.makeMove(roomId, socket.id, position);
      io.to(roomId).emit('game:move', { room, position, playerId: socket.id });
      io.to(roomId).emit('room:updated', { room });
      
      if (room.gameState.status === 'finished') {
        io.to(roomId).emit('game:finished', {
          room,
          winner: room.gameState.winner,
          winningLine: room.gameState.winningLine
        });
      }
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  });
  
  // Disconnect
  socket.on('disconnect', () => {
    // Cleanup logic
    console.log(`Client disconnected: ${socket.id}`);
  });
});
```

### REST API Controllers

```typescript
export class RoomController {
  static async getAllRooms(req: Request, res: Response): Promise<void> {
    try {
      const rooms = roomService.getAllRooms();
      res.json({
        success: true,
        data: rooms,
        count: rooms.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch rooms'
      });
    }
  }
  
  static async createRoom(req: Request, res: Response): Promise<void> {
    try {
      const { roomName } = req.body;
      
      if (!roomName || typeof roomName !== 'string' || !roomName.trim()) {
        res.status(400).json({
          success: false,
          error: 'Room name is required'
        });
        return;
      }
      
      const roomId = generateRoomId();
      const room = roomService.createRoom(roomId, roomName.trim());
      
      res.status(201).json({
        success: true,
        data: room
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to create room'
      });
    }
  }
}
```

## 🧪 Testing

### Frontend Testing

**Unit Tests (Jasmine):**
```typescript
describe('GameService', () => {
  let service: GameService;
  
  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GameService);
  });
  
  it('should create', () => {
    expect(service).toBeTruthy();
  });
  
  it('should initialize with empty board', (done) => {
    service.cells$.subscribe(cells => {
      expect(cells).toEqual(Array(9).fill(null));
      done();
    });
  });
  
  it('should make a move', (done) => {
    service.makeMove(0);
    service.cells$.subscribe(cells => {
      expect(cells[0]).toBe('X');
      done();
    });
  });
});
```

**Component Tests:**
```typescript
describe('GameBoardComponent', () => {
  let component: GameBoardComponent;
  let fixture: ComponentFixture<GameBoardComponent>;
  
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GameBoardComponent]
    }).compileComponents();
    
    fixture = TestBed.createComponent(GameBoardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });
  
  it('should render 9 cells', () => {
    const cells = fixture.nativeElement.querySelectorAll('.cell');
    expect(cells.length).toBe(9);
  });
  
  it('should handle cell click', () => {
    spyOn(component, 'onCellClick');
    const cell = fixture.nativeElement.querySelector('.cell');
    cell.click();
    expect(component.onCellClick).toHaveBeenCalled();
  });
});
```

**Run Frontend Tests:**
```bash
cd unicorn-tictactoe
npm test                    # Run tests in watch mode
npm run test:coverage      # Generate coverage report
```

### Backend Testing

**Service Tests (Jest):**
```typescript
describe('RoomService', () => {
  let roomService: RoomService;
  
  beforeEach(() => {
    roomService = new RoomService();
  });
  
  describe('createRoom', () => {
    it('should create a new room', () => {
      const room = roomService.createRoom('ABC123', 'Test Room');
      
      expect(room.id).toBe('ABC123');
      expect(room.name).toBe('Test Room');
      expect(room.players).toHaveLength(0);
      expect(room.status).toBe('waiting');
    });
  });
  
  describe('joinRoom', () => {
    it('should add player to room', () => {
      roomService.createRoom('ABC123', 'Test Room');
      const room = roomService.joinRoom('ABC123', 'player1', 'Alice');
      
      expect(room.players).toHaveLength(1);
      expect(room.players[0].name).toBe('Alice');
      expect(room.players[0].symbol).toBe('X');
    });
    
    it('should throw error if room is full', () => {
      roomService.createRoom('ABC123', 'Test Room');
      roomService.joinRoom('ABC123', 'player1', 'Alice');
      roomService.joinRoom('ABC123', 'player2', 'Bob');
      
      expect(() => {
        roomService.joinRoom('ABC123', 'player3', 'Charlie');
      }).toThrow('Room is full');
    });
  });
});
```

**WebSocket Tests:**
```typescript
describe('WebSocket Events', () => {
  let io: Server;
  let clientSocket: Socket;
  
  beforeAll((done) => {
    const httpServer = createServer();
    io = new Server(httpServer);
    httpServer.listen(() => {
      const port = (httpServer.address() as AddressInfo).port;
      clientSocket = ioc(`http://localhost:${port}`);
      clientSocket.on('connect', done);
    });
  });
  
  afterAll(() => {
    io.close();
    clientSocket.close();
  });
  
  test('should create room', (done) => {
    clientSocket.emit('room:create', { roomName: 'Test Room' });
    
    clientSocket.on('room:created', ({ room }) => {
      expect(room.name).toBe('Test Room');
      done();
    });
  });
});
```

**Run Backend Tests:**
```bash
cd backend
npm test                    # Run all tests
npm run test:coverage      # Generate coverage report
npm test -- RoomService    # Run specific test file
```

### Test Coverage Goals

- **Statements**: >90%
- **Branches**: >85%
- **Functions**: >90%
- **Lines**: >90%

## 📡 API Reference

### REST API

See [REST_API.md](backend/REST_API.md) for complete documentation.

**Quick Reference:**
```
GET    /health              - Health check
GET    /api/rooms           - List all rooms
GET    /api/rooms/:id       - Get room details
POST   /api/rooms           - Create room
DELETE /api/rooms/:id       - Delete room
```

### WebSocket API

See [WEBSOCKET_API.md](backend/WEBSOCKET_API.md) for complete documentation.

**Client Events:**
- `room:create` - Create new room
- `room:join` - Join existing room
- `room:leave` - Leave room
- `player:ready` - Set ready status
- `game:start` - Start game
- `game:move` - Make move
- `game:reset` - Reset game

**Server Events:**
- `room:created` - Room created
- `room:joined` - Joined room
- `room:updated` - Room state changed
- `game:started` - Game started
- `game:move` - Move made
- `game:finished` - Game ended
- `error` - Error occurred

## 🚀 Deployment

### Development Deployment

**Local:**
```bash
# Terminal 1: Backend
cd backend && npm run dev

# Terminal 2: Frontend
cd unicorn-tictactoe && npm start
```

### Production Deployment

See [DEPLOYMENT_QUICK_START.md](DEPLOYMENT_QUICK_START.md) for quick guide.
See [PRODUCTION_DEPLOYMENT_GUIDE.md](PRODUCTION_DEPLOYMENT_GUIDE.md) for detailed guide.

**Quick Steps:**
1. Build frontend: `ng build --configuration production`
2. Build backend: `npm run build`
3. Deploy to server with PM2 and Nginx
4. Configure SSL with Let's Encrypt

### Docker Deployment

```bash
# Build and run with Docker Compose
cd backend
docker-compose up -d

# Or build manually
docker build -t tictactoe-api .
docker run -p 3000:3000 --env-file .env tictactoe-api
```

## 🤝 Contributing

### Development Workflow

1. **Fork** the repository
2. **Create** a feature branch
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Make** your changes
4. **Test** thoroughly
   ```bash
   npm test
   npm run test:coverage
   ```
5. **Commit** with descriptive messages
   ```bash
   git commit -m "Add amazing feature"
   ```
6. **Push** to your fork
   ```bash
   git push origin feature/amazing-feature
   ```
7. **Open** a Pull Request

### Code Style

**TypeScript:**
- Use strict mode
- Prefer `const` over `let`
- Use arrow functions
- Avoid `any` type
- Use interfaces for object shapes

**Angular:**
- Standalone components
- Signals for state (Angular 16+)
- OnPush change detection
- Lazy loading for routes

**Node.js:**
- Functional programming
- Immutable data structures
- Pure functions
- Error handling with try-catch

### Commit Messages

Follow conventional commits:
```
feat: Add multiplayer room creation
fix: Resolve WebSocket disconnection issue
docs: Update API documentation
test: Add tests for GameService
refactor: Simplify move validation logic
style: Format code with Prettier
chore: Update dependencies
```

### Pull Request Guidelines

- Clear description of changes
- Link to related issues
- Include tests
- Update documentation
- Pass all CI checks
- Request review from maintainers

## 📋 Best Practices

### Frontend Best Practices

1. **Component Design**
   - Single responsibility
   - Reusable and composable
   - Minimal dependencies
   - Clear inputs/outputs

2. **State Management**
   - Centralized in services
   - Immutable updates
   - Observable streams
   - Avoid component state

3. **Performance**
   - OnPush change detection
   - TrackBy for ngFor
   - Lazy loading
   - Bundle optimization

4. **Accessibility**
   - Semantic HTML
   - ARIA labels
   - Keyboard navigation
   - Screen reader testing

### Backend Best Practices

1. **Code Organization**
   - Separation of concerns
   - Single responsibility
   - Dependency injection
   - Clear module boundaries

2. **Error Handling**
   - Try-catch blocks
   - Descriptive error messages
   - Proper HTTP status codes
   - Error logging

3. **Security**
   - Input validation
   - CORS configuration
   - Rate limiting
   - Environment variables

4. **Performance**
   - Efficient algorithms
   - Memory management
   - Connection pooling
   - Caching strategies

### Testing Best Practices

1. **Unit Tests**
   - Test one thing at a time
   - Clear test names
   - Arrange-Act-Assert pattern
   - Mock external dependencies

2. **Integration Tests**
   - Test component interactions
   - Real service instances
   - Database transactions
   - API endpoint testing

3. **Coverage**
   - Aim for >90% coverage
   - Test edge cases
   - Test error paths
   - Test async operations

## 🔧 Debugging

### Frontend Debugging

**Chrome DevTools:**
```typescript
// Add breakpoints in source code
debugger;

// Console logging
console.log('Current state:', this.gameState);
console.table(this.cells);

// Angular DevTools
ng.probe($0).componentInstance
```

**Angular Debugging:**
```bash
# Enable source maps
ng serve --source-map

# Verbose logging
ng serve --verbose
```

### Backend Debugging

**VS Code Launch Config:**
```json
{
  "type": "node",
  "request": "launch",
  "name": "Debug Backend",
  "runtimeExecutable": "npm",
  "runtimeArgs": ["run", "dev"],
  "console": "integratedTerminal",
  "internalConsoleOptions": "neverOpen"
}
```

**Node.js Debugging:**
```bash
# Debug mode
node --inspect dist/server.js

# Debug with breakpoints
node --inspect-brk dist/server.js
```

## 📚 Resources

### Documentation
- [Angular Docs](https://angular.io/docs)
- [Socket.IO Docs](https://socket.io/docs/)
- [Express Docs](https://expressjs.com/)
- [TypeScript Docs](https://www.typescriptlang.org/docs/)

### Tools
- [Angular CLI](https://angular.io/cli)
- [VS Code](https://code.visualstudio.com/)
- [Postman](https://www.postman.com/) - API testing
- [Socket.IO Client Tool](https://amritb.github.io/socketio-client-tool/)

### Learning
- [Angular University](https://angular-university.io/)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- [TypeScript Deep Dive](https://basarat.gitbook.io/typescript/)

## 🆘 Getting Help

- **Documentation**: Check this guide and API docs
- **Issues**: Search existing GitHub issues
- **Discussions**: Start a GitHub discussion
- **Stack Overflow**: Tag with `angular`, `socket.io`, `typescript`

---

**Happy Coding!** 🚀

For more information:
- [Main README](README.md)
- [User Guide](USER_GUIDE.md)
- [Deployment Guide](DEPLOYMENT_QUICK_START.md)
