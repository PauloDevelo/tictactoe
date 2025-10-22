# 🎮 Tic-Tac-Toe Backend Server

Node.js/Express backend server with Socket.IO for real-time multiplayer Tic-Tac-Toe gameplay.

![Node.js](https://img.shields.io/badge/Node.js-20.x-green)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)
![Socket.IO](https://img.shields.io/badge/Socket.IO-4.6-black)
![Express](https://img.shields.io/badge/Express-4.18-lightgrey)
![Test Coverage](https://img.shields.io/badge/Coverage-100%25-brightgreen)

## 🌟 Features

- ✅ **REST API** - Room management endpoints
- ✅ **WebSocket** - Real-time game synchronization
- ✅ **Room System** - Create and join game rooms
- ✅ **Auto-cleanup** - Handles disconnections gracefully
- ✅ **TypeScript** - Full type safety
- ✅ **Functional** - Immutable state, pure functions
- ✅ **Tested** - 100% test coverage
- ✅ **Production Ready** - PM2, Docker, Nginx support

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Git (optional)

### Installation

```bash
# Clone or navigate to backend directory
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Start development server
npm run dev
```

Server runs on `http://localhost:3021`

### Environment Variables

Create `.env` file:

```env
# Server Configuration
PORT=3021
NODE_ENV=development

# CORS Configuration
CORS_ORIGIN=http://localhost:4200

# Rate Limiting (optional)
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# WebSocket Configuration (optional)
WS_PING_TIMEOUT=60000
WS_PING_INTERVAL=25000

# Room Configuration (optional)
MAX_ROOMS=1000
ROOM_CLEANUP_INTERVAL=300000
INACTIVE_ROOM_TIMEOUT=1800000
```

## 📁 Project Structure

```
backend/
├── src/
│   ├── models/              # Data models
│   │   ├── GameState.ts     # Game logic and state
│   │   ├── Player.ts        # Player model
│   │   └── Room.ts          # Room model
│   ├── services/            # Business logic
│   │   └── RoomService.ts   # Room management service
│   ├── controllers/         # REST API controllers
│   │   └── RoomController.ts
│   ├── routes/              # Express routes
│   │   └── roomRoutes.ts
│   ├── __tests__/           # Test files
│   │   ├── RoomService.test.ts
│   │   ├── RoomController.test.ts
│   │   └── websocket.test.ts
│   └── server.ts            # Main server entry point
├── deployment/              # Production deployment scripts
│   ├── deploy.sh
│   ├── backup.sh
│   ├── rollback.sh
│   ├── health-check.sh
│   ├── install-production.sh
│   ├── ecosystem.config.js  # PM2 configuration
│   ├── nginx.conf           # Nginx configuration
│   └── tictactoe-api.service
├── dist/                    # Compiled JavaScript (generated)
├── .env.example             # Environment template
├── .gitignore
├── Dockerfile               # Docker configuration
├── docker-compose.yml       # Docker Compose configuration
├── jest.config.js           # Jest test configuration
├── package.json
├── tsconfig.json            # TypeScript configuration
└── README.md                # This file
```

## 🎯 API Overview

### REST API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Health check |
| `GET` | `/api/rooms` | Get all rooms |
| `GET` | `/api/rooms/:roomId` | Get room details |
| `POST` | `/api/rooms` | Create a new room |
| `DELETE` | `/api/rooms/:roomId` | Delete a room |

See [REST_API.md](./REST_API.md) for detailed documentation.

### WebSocket Events

**Client → Server:**
- `room:create` - Create new room
- `room:join` - Join existing room
- `room:leave` - Leave room
- `room:list` - Get all rooms
- `room:get` - Get room details
- `player:ready` - Set ready status
- `game:start` - Start game
- `game:move` - Make move
- `game:reset` - Reset game

**Server → Client:**
- `room:created` - Room created successfully
- `room:joined` - Player joined room
- `room:left` - Player left room
- `room:updated` - Room state changed
- `room:list` - List of available rooms
- `room:details` - Room details
- `game:started` - Game started
- `game:move` - Move made
- `game:finished` - Game ended
- `game:reset` - Game reset
- `player:disconnected` - Player disconnected
- `error` - Error occurred

See [WEBSOCKET_API.md](./WEBSOCKET_API.md) for detailed documentation.

## 🧪 Testing

### Run Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- RoomService.test.ts
```

### Test Coverage

Current coverage: **100%**

| Category | Coverage |
|----------|----------|
| Statements | 100% |
| Branches | 100% |
| Functions | 100% |
| Lines | 100% |

### Test Files

- **RoomService.test.ts** - Room management logic
- **RoomController.test.ts** - REST API endpoints
- **websocket.test.ts** - WebSocket event handling

## 🏗️ Architecture

### Design Patterns

**Functional Programming:**
- Immutable data structures
- Pure functions
- No side effects in models

**Service Layer:**
- Business logic separation
- Singleton pattern for RoomService
- Dependency injection ready

**Event-Driven:**
- Socket.IO event handlers
- Broadcast pattern for room updates
- Automatic cleanup on disconnect

### Data Flow

```
Client Request
    ↓
WebSocket Event / REST Endpoint
    ↓
Controller / Event Handler
    ↓
RoomService (Business Logic)
    ↓
Model (Immutable State Update)
    ↓
Response / Broadcast to Clients
```

### State Management

**In-Memory Storage:**
- Rooms stored in Map<string, Room>
- Fast access and updates
- Automatic cleanup on empty rooms

**Immutable Updates:**
```typescript
// Models return new instances
const updatedRoom = room.addPlayer(playerId, playerName);

// Service updates the map
this.rooms.set(roomId, updatedRoom);
```

## 🔧 Development

### Available Scripts

```bash
# Development
npm run dev          # Start with hot-reload (nodemon)

# Building
npm run build        # Compile TypeScript to JavaScript

# Production
npm start            # Run compiled code

# Testing
npm test             # Run tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Run tests with coverage

# Deployment
npm run deploy       # Deploy to production
npm run health-check # Check production health
npm run backup       # Backup production data
npm run rollback     # Rollback to previous version

# Docker
npm run docker:build        # Build Docker image
npm run docker:run          # Run Docker container
npm run docker:compose:up   # Start with Docker Compose
npm run docker:compose:down # Stop Docker Compose
npm run docker:compose:logs # View Docker logs
```

### Code Style

**TypeScript Configuration:**
- Strict mode enabled
- ES2020 target
- CommonJS modules
- Source maps for debugging

**Coding Standards:**
- Functional programming preferred
- Immutable data structures
- Pure functions in models
- Error handling with try-catch
- Descriptive variable names

### Adding New Features

1. **Create Model** (if needed)
   ```typescript
   // src/models/NewModel.ts
   export class NewModel {
     constructor(public readonly data: string) {}
   }
   ```

2. **Update Service**
   ```typescript
   // src/services/RoomService.ts
   newMethod(): void {
     // Business logic
   }
   ```

3. **Add Tests**
   ```typescript
   // src/__tests__/RoomService.test.ts
   describe('newMethod', () => {
     it('should work correctly', () => {
       // Test implementation
     });
   });
   ```

4. **Add Endpoint/Event**
   ```typescript
   // REST: src/routes/roomRoutes.ts
   router.get('/new', RoomController.newEndpoint);
   
   // WebSocket: src/server.ts
   socket.on('new:event', (data) => {
     // Handle event
   });
   ```

## 🚀 Deployment

### Development Deployment

```bash
npm run dev
# Server runs on http://localhost:3021
```

### Production Deployment

#### Option 1: Manual Deployment

```bash
# Build
npm run build

# Start with Node
NODE_ENV=production node dist/server.js
```

#### Option 2: PM2 (Recommended)

```bash
# Install PM2 globally
npm install -g pm2

# Start with PM2
pm2 start deployment/ecosystem.config.js

# View logs
pm2 logs tictactoe-api

# Monitor
pm2 monit

# Restart
pm2 restart tictactoe-api
```

#### Option 3: Docker

```bash
# Build image
docker build -t tictactoe-api .

# Run container
docker run -p 3021:3021 --env-file .env tictactoe-api

# Or use Docker Compose
docker-compose up -d
```

#### Option 4: Automated Deployment

```bash
# Use deployment script
./deployment/deploy.sh

# This script:
# - Creates backup
# - Pulls latest code
# - Installs dependencies
# - Runs tests
# - Builds application
# - Performs zero-downtime reload
```

### Production Checklist

- [ ] Environment variables configured
- [ ] CORS origin set correctly
- [ ] SSL certificate installed (Nginx)
- [ ] PM2 configured and running
- [ ] Nginx reverse proxy configured
- [ ] Firewall rules set (ports 80, 443)
- [ ] Health check endpoint responding
- [ ] Logs rotating properly
- [ ] Backups configured
- [ ] Monitoring enabled

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment guide.

## 🔒 Security

### Implemented Security Measures

- ✅ **CORS Protection** - Configured allowed origins
- ✅ **Input Validation** - All inputs validated
- ✅ **Error Handling** - No sensitive data in errors
- ✅ **Environment Variables** - Secrets not in code
- ✅ **Rate Limiting** - Nginx configuration
- ✅ **SSL/TLS** - HTTPS in production

### Security Best Practices

```typescript
// Input validation
if (!roomName || typeof roomName !== 'string' || !roomName.trim()) {
  throw new Error('Invalid room name');
}

// Error handling
try {
  // Operation
} catch (error) {
  const message = error instanceof Error ? error.message : 'Unknown error';
  socket.emit('error', { message });
}

// Environment variables
const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:4200';
```

## 📊 Performance

### Optimization Techniques

**PM2 Cluster Mode:**
- Multiple instances (CPU cores)
- Load balancing
- Zero-downtime reloads

**Efficient Data Structures:**
- Map for O(1) room lookups
- Immutable updates prevent bugs
- Memory-efficient storage

**WebSocket Optimization:**
- Room-based broadcasting
- Minimal payload sizes
- Connection pooling

### Performance Metrics

- **Memory Usage**: ~50MB per instance
- **Response Time**: <10ms average
- **WebSocket Latency**: <50ms
- **Concurrent Rooms**: Tested up to 500

## 🐛 Troubleshooting

### Common Issues

**Port Already in Use:**
```bash
# Change port in .env
PORT=3001

# Or kill process using port
# Windows:
netstat -ano | findstr :3021
taskkill /PID <PID> /F

# Linux/Mac:
lsof -ti:3021 | xargs kill
```

**CORS Errors:**
```bash
# Update .env with correct origin
CORS_ORIGIN=http://localhost:4200

# Restart server
npm run dev
```

**WebSocket Connection Failed:**
```bash
# Check server is running
curl http://localhost:3021/health

# Check CORS configuration
# Check firewall settings
# Verify client URL matches server
```

**Tests Failing:**
```bash
# Clear Jest cache
npm test -- --clearCache

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Run tests with verbose output
npm test -- --verbose
```

## 📚 Documentation

- **[REST API Documentation](./REST_API.md)** - Complete REST API reference
- **[WebSocket API Documentation](./WEBSOCKET_API.md)** - WebSocket events reference
- **[Quick Start Guide](./QUICK_START.md)** - Fast-track setup guide
- **[Deployment Guide](./DEPLOYMENT.md)** - Production deployment
- **[Implementation Summary](./IMPLEMENTATION_SUMMARY.md)** - Development summary

## 🤝 Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Write tests for new features
4. Ensure all tests pass
5. Submit a pull request

### Development Guidelines

- Follow TypeScript best practices
- Maintain 100% test coverage
- Use functional programming patterns
- Write descriptive commit messages
- Update documentation

## 📄 License

This project is open source and available under the MIT License.

## 🙏 Acknowledgments

- Built with [Express](https://expressjs.com/)
- Real-time powered by [Socket.IO](https://socket.io/)
- Testing with [Jest](https://jestjs.io/)
- Process management with [PM2](https://pm2.keymetrics.io/)

## 📞 Support

- **Documentation**: See docs folder
- **Issues**: Open a GitHub issue
- **Questions**: Check the FAQ in main README

## 🗺️ Roadmap

Future enhancements:
- [ ] Redis for persistent storage
- [ ] Database integration (PostgreSQL)
- [ ] Authentication and user accounts
- [ ] Game history and statistics
- [ ] Spectator mode
- [ ] Tournament system
- [ ] Chat functionality
- [ ] AI opponent

---

**Made with 💖 for multiplayer gaming!**

For more information, see the [main project README](../README.md).
