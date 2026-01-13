# 🔍 Debugging: AI Agents Not Playing in Spectator Mode

## Possible Issues

### 1. Missing API Key
- Check if `groqApiKey` is set
- Verify it's passed correctly to the game

### 2. Empty Player Model Map
- Check if `playerModelMap` is populated
- Verify model IDs are correct

### 3. API Errors
- Check browser console for errors
- Look for failed `/api/ai-decision` requests

### 4. Chat Dispatch Issue
- Line 603 references `gameState.players[0].color`
- In spectator mode, player[0] is AI, not human
- This might cause issues

---

## Quick Fixes to Try

### Fix 1: Check Console
Open browser DevTools (F12) and look for:
- "AI decision error"
- Failed network requests
- Any red errors

### Fix 2: Verify API Key
Check that you entered a valid Groq API key in the setup dialog.

### Fix 3: Check Model Mapping
Add console.log to verify:
```typescript
console.log('Player Model Map:', playerModelMap);
console.log('Groq API Key:', groqApiKey ? 'Set' : 'Missing');
```

### Fix 4: Fix Chat Color Reference
The chat dispatch should handle spectator mode:
```typescript
onChat={(msg) => dispatch({ 
  type: 'CHAT', 
  sender: isSpectator ? 'Spectator' : 'Human', 
  message: msg, 
  color: isSpectator ? '#888888' : gameState.players[0].color 
})}
```

---

## Most Likely Issue

The AI logic loop should work fine. The most likely issues are:
1. **API key not set** - Check if you entered it
2. **Network errors** - Check console for failed requests
3. **Model mapping empty** - Verify `playerModelMap` is populated

---

## Next Steps

1. Open browser console (F12)
2. Look for errors
3. Check Network tab for `/api/ai-decision` requests
4. Verify they're succeeding or failing

Let me know what errors you see and I can fix them!
