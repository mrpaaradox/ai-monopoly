import { NextRequest, NextResponse } from 'next/server';
import { GroqAIService } from '@/lib/ai/groq-service';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { apiKey, action, context } = body;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key is required' },
        { status: 400 }
      );
    }

    const aiService = new GroqAIService(apiKey);

    switch (action) {
      case 'BUY_DECISION': {
        const result = await aiService.decideBuyProperty(context);
        return NextResponse.json(result);
      }

      case 'TRADE_DECISION': {
        const result = await aiService.decideTradeOffer(context);
        return NextResponse.json(result);
      }

      case 'CHAT_MESSAGE': {
        const { modelId, player, event, gameContext } = context;
        const message = await aiService.generateChatMessage(
          modelId,
          player,
          event,
          gameContext
        );
        return NextResponse.json({ message });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('AI Decision API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
