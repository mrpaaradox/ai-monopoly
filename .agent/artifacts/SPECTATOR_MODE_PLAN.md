# Spectator Mode Implementation Plan

## Overview
Add a "Spectator Mode" where users can watch AI agents play against each other without participating, only intervening for bailout decisions.

## Changes Needed

### 1. SetupDialog.tsx
- Add `spectatorMode` state (boolean)
- Add toggle switch for spectator mode
- When spectator mode is ON:
  - Hide "Your Name" input
  - Allow selecting 4 AI models instead of 3
  - Change button text to "Watch AI Battle"
- Pass `spectatorMode` to `onStart` callback

### 2. page.tsx (Main Game)
- Update `handleStartGame` to accept `spectatorMode` parameter
- When spectator mode is ON:
  - Create game with 4 AI players (no human player)
  - Set `isSpectator` flag in state
- Bailout decisions:
  - Still show bailout dialog to user
  - User can approve/deny bailouts even in spectator mode
- All other decisions:
  - Handled automatically by AI

### 3. UI Updates
- Show "SPECTATOR MODE" badge when watching
- Disable trade dialog for user (AI-only trades)
- Disable property buying for user
- Keep bailout dialog interactive

## User Flow

### Normal Mode:
1. Enter name
2. Select 3 AI opponents
3. Play the game

### Spectator Mode:
1. Toggle "Spectator Mode" ON
2. Select 4 AI players
3. Click "Watch AI Battle"
4. Watch AI agents play
5. Only interact for bailout decisions

## Benefits
- Watch AI strategies in action
- Test different model combinations
- Learn optimal strategies
- Entertainment value
- Useful for demos/presentations

## Implementation Steps

1. ✅ Add spectator mode toggle to SetupDialog
2. ✅ Update model selection (3 vs 4 models)
3. ✅ Pass spectatorMode to game initialization
4. ✅ Create 4 AI players when spectator mode is ON
5. ✅ Disable user controls except bailouts
6. ✅ Add "SPECTATOR MODE" UI indicator

## Code Snippets

### SetupDialog Toggle:
```typescript
const [spectatorMode, setSpectatorMode] = useState(false);

// Toggle UI
<div className="flex items-center justify-between p-4 rounded-xl border-2">
  <div>
    <div className="font-bold">Spectator Mode</div>
    <div className="text-xs text-muted-foreground">
      Watch AI agents battle (you only handle bailouts)
    </div>
  </div>
  <button onClick={() => setSpectatorMode(!spectatorMode)}>
    {/* Toggle switch */}
  </button>
</div>
```

### Game Initialization:
```typescript
const handleStartGame = (models: string[], playerName: string, apiKey: string, spectatorMode: boolean) => {
  if (spectatorMode) {
    // Create 4 AI players
    const newState = createInitialState(aiNames); // No human player
    setIsSpectator(true);
  } else {
    // Normal: 1 human + 3 AI
    const newState = createInitialState([playerName, ...aiNames]);
    setIsSpectator(false);
  }
};
```

### UI Indicator:
```typescript
{isSpectator && (
  <div className="fixed top-4 right-4 bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold">
    🎭 SPECTATOR MODE
  </div>
)}
```

## Next Steps
1. Implement spectator mode toggle in SetupDialog
2. Update game initialization logic
3. Add spectator mode UI indicators
4. Test with 4 AI agents playing

Would you like me to proceed with the implementation?
