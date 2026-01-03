# 🏗️ Architecture Documentation

## System Overview

The LLM Council is a Next.js application that orchestrates multiple AI models to engage in structured debates. The system leverages Groq's high-performance inference engine to deliver real-time streaming responses.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                     Client (Browser)                     │
│  ┌──────────────────────────────────────────────────┐   │
│  │              React Components                      │   │
│  │  - API Key Input  - Debate Interface              │   │
│  │  - Message Display - Streaming Handler            │   │
│  └──────────────────────────────────────────────────┘   │
└────────────────────┬────────────────────────────────────┘
                     │ HTTP/SSE
                     ▼
┌─────────────────────────────────────────────────────────┐
│                   Next.js App Router                     │
│  ┌──────────────────────────────────────────────────┐   │
│  │            API Route: /api/debate                 │   │
│  │  - Request Handling  - Model Orchestration        │   │
│  │  - SSE Streaming    - Error Handling              │   │
│  └──────────────────────────────────────────────────┘   │
└────────────────────┬────────────────────────────────────┘
                     │ Groq SDK
                     ▼
┌─────────────────────────────────────────────────────────┐
│                   Groq API (LPU™)                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │  Llama 3.3  │  │  Llama 3.1  │  │  Mixtral    │     │
│  │     70B     │  │     70B     │  │    8x7B     │     │
│  └─────────────┘  └─────────────┘  └─────────────┘     │
│                    ┌─────────────┐                       │
│                    │   Gemma2    │                       │
│                    │     9B      │                       │
│                    └─────────────┘                       │
└─────────────────────────────────────────────────────────┘
```

## Component Breakdown

### Frontend Layer

#### `/src/app/page.tsx`
**Purpose**: Main user interface and interaction logic

**Key Features**:
- API key management
- Real-time message streaming
- State management for debate rounds
- UI components for displaying model responses

**State Management**:
```typescript
- apiKey: string           // Groq API key
- isApiKeySet: boolean     // API key validation status
- messages: Message[]      // Debate history
- isDebating: boolean      // Active debate flag
- currentRound: number     // Current debate round
- error: string           // Error messages
```

**Data Flow**:
1. User enters API key → validates → stores in state
2. User clicks "Begin Debate" → triggers API call
3. Receives SSE stream → updates messages in real-time
4. Displays formatted messages with animations

#### `/src/app/globals.css`
**Purpose**: Design system and animations

**Key Features**:
- CSS custom properties for theming
- Glassmorphism styles
- Animation keyframes (gradient, pulse, shimmer, float)
- Responsive utilities

### Backend Layer

#### `/src/app/api/debate/route.ts`
**Purpose**: API endpoint for orchestrating multi-model debates

**Runtime**: Edge (for optimal streaming performance)

**Request Flow**:
```
POST /api/debate
├── Receives: { apiKey, round }
├── Validates API key
├── Initializes Groq client
└── For each model:
    ├── Sends model_start event
    ├── Generates response with context
    ├── Streams tokens via SSE
    ├── Sends model_end event
    └── Adds to conversation history
```

**Event Types**:
```typescript
- model_start: { type, model, persona }
- token: { type, model, content }
- model_end: { type, model }
- done: { type }
- error: { type, error }
```

**Conversation Context**:
Each model receives:
1. System prompt (defines persona and role)
2. Previous messages from all models
3. Current round's prompt
4. Model-specific temperature and max_tokens

### Configuration Layer

#### `/src/config/debate.ts`
**Purpose**: Centralized configuration

**Contents**:
- Debate topic and context
- Model definitions and personas
- Response parameters
- Round-specific prompts

## Data Models

### Message Interface
```typescript
interface Message {
  model: string;        // Model identifier
  persona: string;      // Model persona name
  content: string;      // Response text
  isStreaming?: boolean; // Streaming status
}
```

### Model Persona
```typescript
interface ModelPersona {
  name: string;         // Display name
  icon: string;         // Emoji icon
  color: string;        // Gradient classes
  bias: string;         // Perspective description
  expertise: string[];  // Areas of focus
}
```

## API Integration

### Groq SDK Usage

```typescript
// Initialize client
const groq = new Groq({ apiKey });

// Generate response
const completion = await groq.chat.completions.create({
  messages: conversationHistory,
  model: modelId,
  temperature: 0.8,
  max_tokens: 500,
});
```

### Streaming Implementation

Uses ReadableStream and Server-Sent Events (SSE):
```typescript
const stream = new ReadableStream({
  async start(controller) {
    // Encode and send events
    controller.enqueue(
      encoder.encode(`data: ${JSON.stringify(event)}\n\n`)
    );
  }
});
```

## Performance Optimizations

1. **Edge Runtime**: API route runs on edge for lower latency
2. **Streaming Responses**: Word-by-word display for perceived speed
3. **Controlled Delays**: 50ms between tokens balances speed and readability
4. **Efficient Re-renders**: React state updates batched during streaming
5. **Groq LPU™**: Leverages Groq's fast inference hardware

## Security Considerations

1. **API Key Handling**:
   - Never stored on server
   - Passed per-request from client
   - Not logged or persisted
   
2. **CORS**: Automatically handled by Next.js

3. **Rate Limiting**: Managed by Groq API

4. **Input Validation**: API key format validation

## Scalability

**Current Architecture**:
- Stateless API design
- No database required
- Serverless-ready
- Horizontal scaling via Next.js

**Potential Bottlenecks**:
- Groq API rate limits (free tier)
- Sequential model calls (deliberate design choice)
- Client-side state management (not an issue for current scale)

## Future Architecture Improvements

1. **Parallel Model Calls**: Use Promise.all() for simultaneous responses
2. **Persistent Storage**: Add database for debate history
3. **User Authentication**: Implement auth for API key management
4. **Caching**: Cache model responses for identical prompts
5. **WebSocket**: Replace SSE with WebSocket for bidirectional communication
6. **Load Balancing**: Distribute across multiple API keys

## Development Workflow

```bash
# Local Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint

# File Structure
src/
├── app/
│   ├── api/debate/route.ts    # Backend API
│   ├── page.tsx               # Frontend UI
│   ├── layout.tsx             # Root layout
│   └── globals.css            # Styles
└── config/
    └── debate.ts              # Configuration
```

## Error Handling

**Client-Side**:
- API key validation
- Network error handling
- Stream interruption recovery
- User-friendly error messages

**Server-Side**:
- Try-catch blocks for API calls
- Error event streaming to client
- Graceful degradation

## Monitoring & Debugging

**Development**:
- Next.js development logs
- Browser DevTools for client-side
- Network tab for SSE debugging

**Production** (recommendations):
- Add logging service (e.g., LogRocket)
- Monitor API response times
- Track error rates
- User analytics

---

This architecture prioritizes simplicity, performance, and user experience while remaining flexible for future enhancements.
