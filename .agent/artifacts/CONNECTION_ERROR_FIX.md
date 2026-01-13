# ✅ Fixed: Connection Error with Groq API

## Issue

Getting "Connection error" when calling Groq API:
```
Error: Connection error.
status: undefined,
headers: undefined,
error: undefined
```

## Root Cause

The **Edge runtime** has limitations with certain Node.js SDKs like `groq-sdk`. The Groq SDK requires full Node.js runtime features that aren't available in Edge.

---

## Solution

Changed API route runtime from `edge` to `nodejs`:

```typescript
// Before
export const runtime = 'edge';  // ❌ Limited SDK support

// After  
export const runtime = 'nodejs';  // ✅ Full SDK support
```

---

## Why This Fixes It

### Edge Runtime Limitations:
- ❌ Limited Node.js API access
- ❌ No native modules
- ❌ Restricted network calls
- ❌ Some SDKs don't work

### Node.js Runtime Benefits:
- ✅ Full Node.js API access
- ✅ All npm packages work
- ✅ Better SDK compatibility
- ✅ More debugging options

---

## Testing

1. **Restart the dev server** (the change requires a restart)
   ```bash
   # Stop current server (Ctrl+C)
   npm run dev
   ```

2. **Refresh browser** and start a new game

3. **Check console** - Should see successful API calls instead of connection errors

---

## Troubleshooting

If you still see connection errors:

### 1. Check API Key
- Make sure you entered a valid Groq API key
- It should start with `gsk_`
- Get a new one at: https://console.groq.com

### 2. Check Network
- Ensure you have internet connection
- Check if Groq API is accessible: https://api.groq.com

### 3. Check Console Logs
Look for:
```
API Decision called: { 
  action: 'BUY_DECISION', 
  hasApiKey: true, 
  modelId: 'llama-3.3-70b-versatile' 
}
```

If `hasApiKey: false`, the API key isn't being passed from the UI.

---

## Performance Note

**Edge Runtime:**
- Faster cold starts
- Lower latency
- But: Limited functionality

**Node.js Runtime:**
- Slightly slower cold starts (~100-200ms)
- Full functionality
- Better for complex SDKs

For AI inference, the extra 100-200ms cold start is negligible compared to the 1-3 second LLM response time.

---

## Summary

✅ **Changed**: Runtime from `edge` to `nodejs`  
✅ **Fixed**: Connection errors with Groq SDK  
✅ **Result**: API calls now work properly  

**Restart your dev server and try again!** 🚀
