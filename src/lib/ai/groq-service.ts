import Groq from "groq-sdk";
import { GameState, Player, Tile } from "../game/types";

// Model configurations with personalities
export const MODEL_CONFIGS = {
  'llama-3.3-70b-versatile': {
    name: 'Llama 3.3',
    personality: 'aggressive and risk-taking',
    strategy: 'You are an aggressive player who takes calculated risks. You prioritize building monopolies quickly and are willing to spend most of your money to dominate the board.',
    temperature: 0.8,
  },
  'llama-3.1-8b-instant': {
    name: 'Llama 8B',
    personality: 'balanced and strategic',
    strategy: 'You are a balanced player who carefully weighs risks and rewards. You maintain a healthy cash reserve while building your property portfolio.',
    temperature: 0.6,
  },
  'openai/gpt-oss-120b': {
    name: 'GPT-OSS 120B',
    personality: 'analytical and methodical',
    strategy: 'You are a highly analytical player with advanced reasoning capabilities. You excel at complex problem-solving and make data-driven decisions based on probability and expected value.',
    temperature: 0.5,
  },
  'openai/gpt-oss-20b': {
    name: 'GPT-OSS 20B',
    personality: 'adaptive and efficient',
    strategy: 'You are an efficient player optimized for cost-effective decisions. You adapt your strategy dynamically based on game state and opponent behavior, focusing on agentic workflows.',
    temperature: 0.65,
  },
} as const;

export type ModelId = keyof typeof MODEL_CONFIGS;

interface AIDecisionContext {
  gameState: GameState;
  player: Player;
  currentTile: Tile;
  modelId: string;
}

export class GroqAIService {
  private groq: Groq;

  constructor(apiKey: string) {
    this.groq = new Groq({ apiKey });
  }

  /**
   * Get AI decision for buying a property
   */
  async decideBuyProperty(context: AIDecisionContext): Promise<{
    decision: 'BUY' | 'PASS';
    reasoning: string;
  }> {
    const { gameState, player, currentTile, modelId } = context;
    const config = MODEL_CONFIGS[modelId as ModelId] || MODEL_CONFIGS['llama-3.1-8b-instant'];

    const prompt = this.buildBuyPropertyPrompt(gameState, player, currentTile, config);

    try {
      const completion = await this.groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: `You are playing Monopoly. ${config.strategy}\n\nRespond with either "BUY" or "PASS" followed by a brief reason.`
          },
          {
            role: "user",
            content: prompt
          }
        ],
        model: modelId,
        temperature: config.temperature,
        max_tokens: 300,
      });

      const content = completion.choices[0]?.message?.content;
      
      if (!content) {
        console.error(`[Groq] Empty content for ${modelId}`, completion);
        return this.fallbackBuyDecision(player, currentTile);
      }

      const response = content;
      
      // Parse response flexibly
      const decision = response.toUpperCase().includes('BUY') ? 'BUY' : 'PASS';
      const reasoning = response.replace(/^(BUY|PASS)/i, '').trim() || 'No reasoning provided';
      
      return {
        decision,
        reasoning
      };
    } catch (error) {
      console.error('Groq API error:', error);
      // Fallback to rule-based decision
      return this.fallbackBuyDecision(player, currentTile);
    }
  }

  /**
   * Get AI decision for trading
   */
  async decideTradeOffer(context: AIDecisionContext & { 
    targetProperty: Tile;
    targetPlayer: Player;
  }): Promise<{
    shouldTrade: boolean;
    offerAmount: number;
    reasoning: string;
  }> {
    const { gameState, player, targetProperty, targetPlayer, modelId } = context;
    const config = MODEL_CONFIGS[modelId as ModelId] || MODEL_CONFIGS['llama-3.1-8b-instant'];

    const prompt = this.buildTradePrompt(gameState, player, targetProperty, targetPlayer, config);

    try {
      const completion = await this.groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: `You are playing Monopoly. ${config.strategy}\n\nRespond with YES or NO for trading, followed by an offer amount if yes, and a brief reason.`
          },
          {
            role: "user",
            content: prompt
          }
        ],
        model: modelId,
        temperature: config.temperature,
        max_tokens: 300,
      });

      const content = completion.choices[0]?.message?.content;
      
      if (!content) {
        console.error(`[Groq] Empty content for ${modelId}`, completion);
        return this.fallbackTradeDecision(player, targetProperty);
      }

      const response = content;
      
      // Parse response flexibly
      const shouldTrade = response.toUpperCase().includes('YES');
      const offerMatch = response.match(/\$(\d+)|\b(\d+)\s*dollars?/i);
      const offerAmount = offerMatch ? parseInt(offerMatch[1] || offerMatch[2]) : 0;
      const reasoning = response.replace(/^(YES|NO)/i, '').trim() || 'No reasoning provided';
      
      return {
        shouldTrade,
        offerAmount: Math.min(offerAmount, player.money),
        reasoning
      };
    } catch (error) {
      console.error('Groq API error:', error);
      return this.fallbackTradeDecision(player, targetProperty);
    }
  }

  /**
   * Generate a chat message based on game event
   */
  async generateChatMessage(
    modelId: string,
    player: Player,
    event: string,
    context: string
  ): Promise<string> {
    const config = MODEL_CONFIGS[modelId as ModelId] || MODEL_CONFIGS['llama-3.1-8b-instant'];

    try {
      const completion = await this.groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: `You are ${player.name}, a ${config.personality} Monopoly player. Respond with a short, in-character comment (max 15 words) about the game event. Be conversational and show personality.`
          },
          {
            role: "user",
            content: `Event: ${event}\nContext: ${context}\n\nYour response:`
          }
        ],
        model: modelId,
        temperature: 0.9,
        max_tokens: 50,
      });

      return completion.choices[0]?.message?.content?.trim() || "Interesting move.";
    } catch (error) {
      console.error('Groq API error:', error);
      return "Interesting move.";
    }
  }

  // Helper methods for building prompts
  private buildBuyPropertyPrompt(
    gameState: GameState,
    player: Player,
    tile: Tile,
    config: typeof MODEL_CONFIGS[ModelId]
  ): string {
    const ownedProps = player.properties.map(id => gameState.board[id]);
    const sameGroupOwned = ownedProps.filter(p => p.group === tile.group).length;
    const totalInGroup = gameState.board.filter(t => t.group === tile.group).length;

    return `
PROPERTY DECISION:
Property: ${tile.name}
Price: $${tile.price}
Group: ${tile.group}
Rent: $${tile.rent?.[0] || 0}

YOUR SITUATION:
Current Money: $${player.money}
Properties Owned: ${player.properties.length}
You own ${sameGroupOwned}/${totalInGroup} properties in the ${tile.group} group

GAME STATE:
Current Turn: ${gameState.currentPlayerIndex + 1}
Other Players: ${gameState.players.filter(p => p.id !== player.id && !p.isBankrupt).length}

Should you BUY or PASS on ${tile.name}?
Consider: Your cash reserves, potential for monopoly, and your ${config.personality} playing style.
    `.trim();
  }

  private buildTradePrompt(
    gameState: GameState,
    player: Player,
    targetProperty: Tile,
    targetPlayer: Player,
    config: typeof MODEL_CONFIGS[ModelId]
  ): string {
    const ownedProps = player.properties.map(id => gameState.board[id]);
    const sameGroupOwned = ownedProps.filter(p => p.group === targetProperty.group).length;
    const totalInGroup = gameState.board.filter(t => t.group === targetProperty.group).length;

    return `
TRADE DECISION:
Target Property: ${targetProperty.name}
Owner: ${targetPlayer.name}
Property Price: $${targetProperty.price}
Group: ${targetProperty.group}

YOUR SITUATION:
Current Money: $${player.money}
You own ${sameGroupOwned}/${totalInGroup} properties in the ${targetProperty.group} group
${sameGroupOwned > 0 ? `This would help complete your ${targetProperty.group} monopoly!` : ''}

Should you offer a trade? If yes, how much money should you offer?
Max offer: $${player.money}
Consider: Fair market value is typically 100-120% of property price.
Your ${config.personality} style suggests ${config.temperature > 0.7 ? 'aggressive' : config.temperature > 0.5 ? 'moderate' : 'conservative'} offers.
    `.trim();
  }

  private fallbackBuyDecision(player: Player, tile: Tile): {
    decision: 'BUY' | 'PASS';
    reasoning: string;
  } {
    if (player.money >= (tile.price || 0) + 50) {
      return {
        decision: 'BUY',
        reasoning: 'Fallback: Have enough money with buffer'
      };
    }
    return {
      decision: 'PASS',
      reasoning: 'Fallback: Insufficient funds'
    };
  }
  private fallbackTradeDecision(player: Player, targetProperty: Tile): {
    shouldTrade: boolean;
    offerAmount: number;
    reasoning: string;
  } {
    return { shouldTrade: false, offerAmount: 0, reasoning: "Fallback: AI unavailable" };
  }
}
