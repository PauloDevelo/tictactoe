# 🎮 Tic-Tac-Toe User Guide

Welcome to the magical world of Unicorn vs Cat Tic-Tac-Toe! This guide will help you get started and master both local and online multiplayer gameplay.

## 📖 Table of Contents

1. [Getting Started](#getting-started)
2. [Game Modes](#game-modes)
3. [How to Play](#how-to-play)
4. [Controls](#controls)
5. [Accessibility Features](#accessibility-features)
6. [Tips and Strategies](#tips-and-strategies)
7. [Troubleshooting](#troubleshooting)
8. [FAQ](#faq)

## 🚀 Getting Started

### Accessing the Game

**Local Development:**
```
http://localhost:4200
```

**Production:**
```
https://your-domain.com
```

### First Time Setup

No registration or installation required! Simply:
1. Open the game URL in your web browser
2. Choose your game mode (Local or Multiplayer)
3. Start playing immediately!

### System Requirements

- **Browser**: Modern web browser (Chrome, Firefox, Safari, Edge)
- **Internet**: Required for multiplayer mode only
- **JavaScript**: Must be enabled
- **Screen**: Works on desktop, tablet, and mobile devices

## 🎯 Game Modes

### 1. Local Mode (Single Device)

Perfect for playing with a friend on the same device.

**How to Start:**
1. Click **"Play Locally"** on the home screen
2. The game board appears immediately
3. Players take turns on the same device

**Features:**
- No internet required
- Instant start
- Score tracking across games
- Perfect for quick matches

### 2. Multiplayer Mode (Online)

Play with friends anywhere in the world!

**How to Start:**

**As Host (Player 1):**
1. Click **"Create Room"**
2. Enter a room name (e.g., "My Game Room")
3. Share the **Room Code** with your friend
4. Wait for your friend to join
5. Click **"Ready"** when you're prepared
6. Click **"Start Game"** when both players are ready

**As Guest (Player 2):**
1. Click **"Join Room"**
2. Enter the **Room Code** shared by your friend
3. Enter your **Player Name**
4. Click **"Ready"** when you're prepared
5. Wait for the host to start the game

**Features:**
- Real-time synchronization
- Play with anyone, anywhere
- Automatic reconnection handling
- Room-based matchmaking

## 🎮 How to Play

### Basic Rules

1. **Grid**: The game is played on a 3×3 grid
2. **Players**: Two players take turns
   - 🦄 **Unicorn** (Player 1) - Always goes first
   - 🐱 **Cat** (Player 2) - Goes second
3. **Objective**: Get three of your symbols in a row
4. **Winning**: First to align 3 symbols horizontally, vertically, or diagonally wins
5. **Draw**: If all 9 cells are filled with no winner, the game is a draw

### Making a Move

**Mouse/Touch:**
- Click or tap any empty cell to place your piece
- Your symbol (🦄 or 🐱) appears in the cell
- Turn automatically switches to the other player

**Keyboard:**
- Press **Tab** to navigate between cells
- Press **Enter** or **Space** to place your piece in the focused cell
- Visual focus indicator shows which cell is selected

### Winning Combinations

You can win by getting three in a row:

**Horizontal:**
```
🦄 🦄 🦄
🐱 🐱 -
-  -  -
```

**Vertical:**
```
🦄 🐱 -
🦄 🐱 -
🦄 -  -
```

**Diagonal:**
```
🦄 🐱 -
🐱 🦄 🐱
-  -  🦄
```

### Game Flow

1. **Start**: Unicorn 🦄 makes the first move
2. **Turns**: Players alternate placing their symbols
3. **Win**: Game ends when a player gets 3 in a row
4. **Draw**: Game ends if all cells are filled with no winner
5. **Reset**: Click "Reset Game" to play again
6. **Scores**: Wins and draws are tracked automatically

## ⌨️ Controls

### Mouse Controls

| Action | Control |
|--------|---------|
| Place piece | Click empty cell |
| Reset game | Click "Reset Game" button |
| Create room | Click "Create Room" button |
| Join room | Click "Join Room" button |
| Ready up | Click "Ready" checkbox |
| Start game | Click "Start Game" button |

### Keyboard Controls

| Action | Control |
|--------|---------|
| Navigate cells | **Tab** / **Shift+Tab** |
| Place piece | **Enter** or **Space** |
| Navigate buttons | **Tab** |
| Activate button | **Enter** or **Space** |

### Touch Controls (Mobile/Tablet)

| Action | Control |
|--------|---------|
| Place piece | Tap empty cell |
| Reset game | Tap "Reset Game" button |
| All other actions | Tap respective buttons |

## ♿ Accessibility Features

This game is designed to be accessible to everyone!

### Screen Reader Support

- **Cell Announcements**: Each cell announces its position and state
  - Example: "Cell 1, empty" or "Cell 5, occupied by Unicorn"
- **Turn Announcements**: "Unicorn's turn" or "Cat's turn"
- **Game Status**: "Unicorn wins!" or "It's a draw!"
- **Score Updates**: Announced when scores change

### Keyboard Navigation

- **Full keyboard access** to all game functions
- **Visible focus indicators** show which element is selected
- **Logical tab order** follows natural reading flow
- **No keyboard traps** - you can always navigate away

### Visual Accessibility

- **High contrast** colors meet WCAG AA standards
- **Large click targets** (minimum 44×44 pixels)
- **Clear visual feedback** for all interactions
- **Responsive text** scales with browser settings
- **No color-only information** - symbols used for players

### ARIA Labels

All interactive elements have descriptive labels:
- Buttons clearly state their purpose
- Game state is announced via live regions
- Form fields have associated labels
- Status messages are announced automatically

## 💡 Tips and Strategies

### Beginner Tips

1. **Center Control**: The center cell (position 5) is the most powerful
2. **Corner Strategy**: Corners offer more winning combinations
3. **Block Opponent**: Always block if your opponent has 2 in a row
4. **Think Ahead**: Plan your next 2-3 moves
5. **Create Forks**: Try to create two winning threats at once

### Winning Strategies

**Opening Moves:**
- **Best first move**: Center (position 5) or corner (1, 3, 7, 9)
- **Avoid edges**: Edge cells (2, 4, 6, 8) are weaker opening moves

**Mid-game:**
- Look for opportunities to create multiple winning threats
- Force your opponent into defensive moves
- Control the center and corners

**Defense:**
- Always block opponent's winning moves
- Don't let opponent control opposite corners
- Watch for fork setups (two winning threats)

### Perfect Play

With perfect play from both sides, Tic-Tac-Toe always ends in a draw. The key is to:
1. Never make a mistake
2. Always block opponent's winning moves
3. Create threats when possible
4. Maintain center/corner control

## 🔧 Troubleshooting

### Common Issues

#### Game Not Loading

**Problem**: Page is blank or stuck loading

**Solutions:**
- Refresh the page (F5 or Ctrl+R)
- Clear browser cache and cookies
- Try a different browser
- Check internet connection
- Disable browser extensions temporarily

#### Cannot Join Room

**Problem**: "Room not found" or "Room is full" error

**Solutions:**
- Verify the room code is correct (case-sensitive)
- Ask host to create a new room
- Ensure room hasn't been deleted
- Check that room doesn't already have 2 players

#### Multiplayer Not Syncing

**Problem**: Moves not appearing for other player

**Solutions:**
- Check internet connection
- Refresh both players' browsers
- Leave and rejoin the room
- Create a new room if issue persists

#### Keyboard Navigation Not Working

**Problem**: Tab key doesn't move focus

**Solutions:**
- Click on the game board first
- Ensure JavaScript is enabled
- Try a different browser
- Check for browser extensions interfering

#### Screen Reader Issues

**Problem**: Announcements not being read

**Solutions:**
- Ensure screen reader is running
- Refresh the page
- Check browser compatibility
- Try a different screen reader

### Browser Compatibility

**Fully Supported:**
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

**Mobile Browsers:**
- Chrome Mobile
- Safari iOS
- Firefox Mobile
- Samsung Internet

**Not Supported:**
- Internet Explorer (any version)
- Very old browser versions

### Performance Issues

**Problem**: Game is slow or laggy

**Solutions:**
- Close other browser tabs
- Disable browser extensions
- Clear browser cache
- Check system resources
- Try a different device

## ❓ FAQ

### General Questions

**Q: Is the game free to play?**
A: Yes! Completely free with no ads or in-app purchases.

**Q: Do I need to create an account?**
A: No registration required. Just open and play!

**Q: Can I play offline?**
A: Local mode works offline. Multiplayer requires internet.

**Q: How many players can join a room?**
A: Exactly 2 players per room.

**Q: Can I play on mobile?**
A: Yes! The game is fully responsive and works on all devices.

### Gameplay Questions

**Q: Who goes first?**
A: Unicorn 🦄 always goes first in every game.

**Q: Can I undo a move?**
A: No, moves are final. Think before you click!

**Q: What happens if someone disconnects?**
A: The other player is notified. The room remains open for reconnection.

**Q: Are scores saved?**
A: Scores persist during your session but reset when you close the browser.

**Q: Can I play against a computer?**
A: Currently only 2-player mode is available (local or online).

### Technical Questions

**Q: What technology is used?**
A: Angular 20 frontend with Node.js/Socket.IO backend.

**Q: Is my data secure?**
A: No personal data is collected. Game state is temporary.

**Q: Can I host my own server?**
A: Yes! See the Developer Guide for instructions.

**Q: Is the source code available?**
A: Yes, the project is open source.

### Multiplayer Questions

**Q: How do I share a room code?**
A: Copy the room code and send it via text, email, or messaging app.

**Q: How long do rooms last?**
A: Rooms are deleted when empty or after 30 minutes of inactivity.

**Q: Can spectators watch games?**
A: Not currently, but it's on the roadmap!

**Q: Can I play multiple games simultaneously?**
A: You can only be in one room at a time per browser.

## 🎨 Customization

### Browser Settings

You can customize your experience using browser settings:

**Text Size:**
- Zoom in/out: Ctrl + Plus/Minus (Cmd on Mac)
- The game scales responsively

**Dark Mode:**
- Currently not available, but planned for future release

**Sound:**
- Currently no sound effects (coming soon!)

## 📱 Mobile Experience

### Portrait Mode
- Optimized layout for vertical screens
- Larger touch targets
- Simplified navigation

### Landscape Mode
- Wider layout utilizes screen space
- Side-by-side score display
- Enhanced visibility

### Touch Gestures
- **Tap**: Select cell or button
- **Double-tap**: Zoom (browser default)
- **Pinch**: Zoom in/out (browser default)

## 🏆 Scoring System

### Points
- **Win**: +1 to winner's score
- **Draw**: +1 to both players' draw count
- **Loss**: No points

### Score Display
```
Unicorn: 5 wins
Cat: 3 wins
Draws: 2
```

### Score Reset
- Scores reset when you refresh the page
- Each room has independent scores
- Local mode scores are separate from multiplayer

## 🎯 Game Etiquette

### Good Sportsmanship
- ✅ Be patient while opponent thinks
- ✅ Say "good game" after matches
- ✅ Don't quit mid-game
- ✅ Be respectful in room names
- ✅ Give opponent time to ready up

### Fair Play
- ❌ Don't use external tools or bots
- ❌ Don't create multiple accounts
- ❌ Don't spam room creation
- ❌ Don't use offensive room names

## 📞 Getting Help

### Support Resources

1. **This User Guide** - Comprehensive gameplay information
2. **Developer Guide** - Technical details and architecture
3. **FAQ Section** - Common questions answered
4. **GitHub Issues** - Report bugs or request features

### Reporting Issues

When reporting a problem, include:
- What you were trying to do
- What happened instead
- Browser and device information
- Steps to reproduce the issue
- Screenshots if applicable

### Feature Requests

We welcome suggestions! Consider:
- How it improves the game
- Who would benefit
- Any similar features in other games
- Potential implementation challenges

## 🎉 Have Fun!

Remember, Tic-Tac-Toe is a game of strategy and fun. Whether you're playing locally with a friend or competing online, enjoy the magical experience of Unicorn vs Cat!

**May the best player win!** 🦄🐱

---

**Need more help?**
- Check the [Developer Guide](DEVELOPER_GUIDE.md) for technical details
- Visit the [main README](README.md) for project overview
- Open an issue on GitHub for support
