# Connect 4 Implementation Plan

## Background
The backend already has Connect 4 game logic (Connect4GameState.ts, RoomService.ts). The frontend has a Connect4Board component. The frontend `GameService` currently only supports Tic-Tac-Toe (9 cells, 0-8). We need to update it to support Connect 4.

## Step 1: Update frontend `GameService` to support Connect 4
- Add `@Input() gameType: GameType` to track which game mode is active
- When `gameType === 'connect4'`, use a 42-cell board (7x6)
- Add `makeMoveC4` function that:
  1. Takes a **column index** (0-6), not a cell index
  2. Computes the drop position using gravity (lowest empty cell in that column)
  3. Places the piece at that position
  4. Checks for winner using `checkWinnerC4` (4-in-a-row, 4-in-a-column, 4-in-a-diagonal)
  5. Returns the new state

## Step 2: Verify the integration
- The `GameBoard` component already handles both game types
- The `GameBoard` passes `onColumnClick(col)` to `onlineGameService.makeMove(col)` or `gameService.makeMove(col)`
- The backend's `RoomService.makeMove()` already handles Connect 4 column-based moves

## Step 3: Write unit tests for the frontend Connect 4 logic
- Test `getDropPosition` (gravity)
- Test `checkWinnerC4` (4-in-a-row, 4-in-a-column, 4-in-a-diagonal)
- Test `makeMoveC4` (valid/invalid moves)
- Test `getWinningLineC4` (returns 4 indices for the winning line)

## Step 4: End-to-end validation
- Create a Connect 4 room and play a game
- Verify that pieces drop to the correct position (gravity)
- Verify that winning lines are detected correctly
