"use client";

import { useEffect, useReducer, useState } from "react";
import { createInitialState, rollDice, buyProperty, skipBuy, nextTurn, buildHouse, payJailFine } from "@/lib/game/engine";

import { GameState } from "@/lib/game/types";
import { Board } from "@/components/game/Board";
import { GameOverlay } from "@/components/game/GameOverlay";
import { TradeDialog } from "@/components/game/TradeDialog";
import { SetupDialog } from "@/components/game/SetupDialog";
import { CardDrawOverlay } from "@/components/game/CardDrawOverlay";

// Reducer to handle state transitions
type Action = 
  | { type: 'INIT_GAME'; payload: GameState }
  | { type: 'ROLL' }
  | { type: 'BUY' }
  | { type: 'PASS' }
  | { type: 'NEXT' }
  | { type: 'BUILD'; propertyId: number }
  | { type: 'TRADE'; targetPlayerId: string; offer: number; propertyId: number; offeringPropertyId: number | null }
  | { type: 'DISMISS_POPUP' }
  | { type: 'CHAT'; sender: string; message: string; color: string }
  | { type: 'PAY_JAIL_FINE' };

const gameReducer = (state: GameState | null, action: Action): GameState | null => {
  switch (action.type) {
    case 'INIT_GAME': return action.payload;
    case 'ROLL': return state ? rollDice(state) : null;
    case 'BUY': return state ? buyProperty(state) : null;
    case 'PASS': return state ? skipBuy(state) : null;
    case 'BUILD': return state ? buildHouse(state, action.propertyId) : null;
    case 'PAY_JAIL_FINE': return state ? payJailFine(state) : null;
    case 'TRADE': 
        if (!state) return null;
        // Logic for specialized trade: P0 requests targetProp from Target for (OfferMoney + OfferingProp)
        const target = state.players.find(p => p.id === action.targetPlayerId);
        const player = state.players[0]; // Human
        const targetProp = state.board.find(t => t.id === action.propertyId);
        const offeringProp = action.offeringPropertyId ? state.board.find(t => t.id === action.offeringPropertyId) : null;
        
        if (!target || !targetProp || !player) return state;
        
        let accepted = false;
        
        // AI Logic Valuation
        const targetValue = (targetProp.price || 0) * 1.5; 
        
        let offerValue = action.offer;
        if (offeringProp) {
            offerValue += (offeringProp.price || 0); 
            const group = offeringProp.group;
            const aiPropsInGroup = target.properties.filter(pid => state.board[pid].group === group).length;
             if (aiPropsInGroup > 0) offerValue += 100;
        }

        if (offerValue >= targetValue) {
             accepted = true;
        }

        if (accepted) {
             if (player.money < action.offer) {
                 return { ...state, chat: [...state.chat, { sender: 'System', message: 'Trade failed: Insufficient funds.', color: '#999' }] };
             }
             
             const newHumanMoney = player.money - action.offer;
             const newTargetMoney = target.money + action.offer;
             
             let newHumanProps = [...player.properties, targetProp.id];
             let newTargetProps = target.properties.filter(id => id !== targetProp.id);

             if (offeringProp) {
                 newHumanProps = newHumanProps.filter(id => id !== offeringProp.id);
                 newTargetProps = [...newTargetProps, offeringProp.id];
             }
             
             const updatedHuman = { ...player, money: newHumanMoney, properties: newHumanProps };
             const updatedTarget = { ...target, money: newTargetMoney, properties: newTargetProps };
             
             const updatedTargetProp = { ...targetProp, ownerId: player.id };
             const updatedOfferingProp = offeringProp ? { ...offeringProp, ownerId: target.id } : null;
             
             const updatedPlayers = state.players.map(p => {
                 if (p.id === player.id) return updatedHuman;
                 if (p.id === target.id) return updatedTarget;
                 return p;
             });
             
             const updatedBoard = state.board.map(t => {
                 if (t.id === targetProp.id) return updatedTargetProp;
                 if (updatedOfferingProp && t.id === updatedOfferingProp.id) return updatedOfferingProp;
                 return t;
             });
             
             const msg = offeringProp 
                ? `Deal accepted! Swapped ${targetProp.name} for ${offeringProp.name} + $${action.offer}.`
                : `Deal accepted! I sold ${targetProp.name} for $${action.offer}.`;

             return { 
                 ...state, 
                 players: updatedPlayers, 
                 board: updatedBoard,
                 chat: [...state.chat, { sender: target.name, message: msg, color: target.color }] 
             };
        } else {
             // Counter Offer Logic
             const counterOffer = Math.floor(targetValue * 1.1); // AI wants 10% premium
             const rejectMsg = [
                 `I can't accept that. How about $${counterOffer}?`,
                 `Too low! I'd consider $${counterOffer}.`,
                 `Your offer is insulting. Bring me $${counterOffer} and we'll talk.`,
                 `No deal. I value this at $${counterOffer}.`
             ];
             const randomMsg = rejectMsg[Math.floor(Math.random() * rejectMsg.length)];
             
             return { ...state, chat: [...state.chat, { sender: target.name, message: randomMsg, color: target.color }] };
        }

    case 'NEXT': return state ? nextTurn(state) : null;
    case 'CHAT': return state ? { ...state, chat: [...state.chat, { sender: action.sender, message: action.message, color: action.color }] } : null;
    case 'DISMISS_POPUP': return state ? { ...state, lastDrawnCard: undefined } : null;
    default: return state;
  }
};

const AI_DELAY = 1000;

export default function Home() {
  const [setupComplete, setSetupComplete] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [selectedAIModels, setSelectedAIModels] = useState<string[]>([]);
  
  // Initialize with null
  const [gameState, dispatch] = useReducer(gameReducer, null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Use Effect to Re-init state when setup changes (This is a bit tricky with useReducer, 
  // usually simpler to have a separate 'INIT' action or just use state for the reducer info.
  // Actually, we can just let existing Reducer run, but we need to inject the data.
  // We'll create a new function `initializeGame(models)` that returns the state, 
  // and we'll forcingly replace the state? No, we can't easily replace reducer state from outside without an action.
  // Let's add 'INIT_GAME' action.
  
  /* 
     Correction: logic below handles INIT action 
  */
  
  // AI Chat Listener
  useEffect(() => {
       if (!gameState || !setupComplete) return;
       const lastMsg = gameState.chat[gameState.chat.length - 1];
       if (lastMsg && lastMsg.sender === 'Human') {
           // Pick random AI
           const aiPlayers = gameState.players.filter(p => p.isAI);
           const randomAI = aiPlayers[Math.floor(Math.random() * aiPlayers.length)];
           
           if (randomAI) {
               const timer = setTimeout(() => {
                   let response = "";
                   const m = lastMsg.message.toLowerCase();
                   if (m.includes('hi') || m.includes('hello') || m.includes('hey')) {
                        const greetings = [
                            `Hello ${gameState.players[0].name}! Ready to lose?`,
                            "Greetings. I am running entirely on local compute.",
                            "Hi there! Nice moves so far.",
                            "Beep boop. Just kidding, hi!"
                        ];
                        response = greetings[Math.floor(Math.random() * greetings.length)];
                   } else if (m.includes('trade')) {
                        response = "I'm always open to fair deals, but I'm expensive.";
                   } else if (m.includes('strategy') || m.includes('idea')) {
                        response = "My strategy is simple: Buy everything and bankrupt you.";
                   } else if (m.includes('money') || m.includes('rich')) {
                        response = "Cash is king.";
                   } else {
                        const generic = [
                            "Interesting point.",
                            "Focus on the game!",
                            "Are you going to roll or just chat?",
                            "I'm calculating my next move.",
                            "Did you see the stock market today? Just kidding."
                        ];
                        response = generic[Math.floor(Math.random() * generic.length)];
                   }
                   dispatch({ type: 'CHAT', sender: randomAI.name, message: response, color: randomAI.color });
               }, 1500 + Math.random() * 2000);
               return () => clearTimeout(timer);
           }
       }
  }, [gameState, setupComplete]); // dependency updated

  // AI Logic Loop (only runs if setupComplete)
  useEffect(() => {
    if (!setupComplete || !gameState) return;
    // ... logic ...
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    if (!currentPlayer.isAI || gameState.winner) return;

    // ... (rest of AI loop) ...
     const timer = setTimeout(() => {
        if (gameState.gamePhase === 'ROLL') {
            dispatch({ type: 'ROLL' });
        } else if (gameState.gamePhase === 'ACTION') {
            const tile = gameState.board[currentPlayer.position];
            // AI Decision: Buy if money > price + 100 buffer.
            if ((['PROPERTY', 'RAILROAD', 'UTILITY'].includes(tile.type)) && !tile.ownerId && tile.price) {
                if (currentPlayer.money >= tile.price + 50) {
                    dispatch({ type: 'BUY' });
                    // Simulate different personalities based on name?
                    const msgs = [
                        `Acquiring ${tile.name} to diversify my portfolio.`,
                        `Buying ${tile.name}. It's a strategic asset.`,
                        `Small investment in ${tile.name}.`,
                        `I'll take ${tile.name}, thanks.`
                    ];
                    dispatch({ type: 'CHAT', sender: currentPlayer.name, message: msgs[Math.floor(Math.random() * msgs.length)], color: currentPlayer.color });
                } else {
                     dispatch({ type: 'PASS' });
                     dispatch({ type: 'CHAT', sender: currentPlayer.name, message: `Passing on ${tile.name} for now. too pricey.`, color: currentPlayer.color });
                }
            } else if (tile.ownerId && tile.ownerId !== currentPlayer.id) {
                 // Paying rent is automatic in engine landing, so logic here just passes turn usually? 
                 // Wait, Phase ACTION means user choice. If owned, engine moves to END_TURN automatically usually, 
                 // UNLESS it was buyable. 
                 // If we are in ACTION, it means it IS buyable or unowned.
                 // If owned, handleTileLanding sets phase to ROLL/END_TURN.
                 // So we shouldn't be in ACTION if it's owned generally? 
                 // Ah, if we land on owned property, we pay rent immediately in handleTileLanding.
                 // So ACTION phase is exclusively for Buying decisions for Unowned properties.
                 // So the else if case here is technically unreachable for owned props, 
                 // BUT let's keep it for safety or Auction. 
                 dispatch({ type: 'PASS' });
            } else {
                 dispatch({ type: 'PASS' });
            }
        } else if (gameState.gamePhase === 'END_TURN') {
            // ... Build logic ...
            const ownedProps = currentPlayer.properties.map(id => gameState.board[id]);
            const groups = [...new Set(ownedProps.map(p => p.group).filter(g => g))];
            
            let built = false;
            for (const group of groups) {
                if (!group) continue;
                const groupProps = gameState.board.filter(t => t.group === group);
                const hasMonopoly = groupProps.every(t => t.ownerId === currentPlayer.id);
                
                if (hasMonopoly) {
                    for (const prop of groupProps) {
                        // Strict check: Must be PROPERTY and have a valid houseCost > 0
                        if (prop.type === 'PROPERTY' && (prop.houseCost || 0) > 0) {
                            if (currentPlayer.money > (prop.houseCost || 0) + 200 && (prop.houses || 0) < 5) {
                                dispatch({ type: 'BUILD', propertyId: prop.id });
                                dispatch({ type: 'CHAT', sender: currentPlayer.name, message: `Developing ${prop.name} with new infrastructure.`, color: currentPlayer.color });
                                built = true;
                                break; 
                            }
                        }
                    }
                }
                if (built) break;
            }

            if (!built) {
                dispatch({ type: 'NEXT' });
            } 
        }
    }, AI_DELAY);
    return () => clearTimeout(timer);
  }, [gameState, setupComplete]);

  const [isTradeOpen, setIsTradeOpen] = useState(false);
  
  // Custom Reducer with replacement capability
  // Actually, standard reducer with INIT action is cleaner.
  /* 
     Note: I need to update the reducer definition above to handle INIT_GAME
  */
  
  const handleStartGame = (models: string[], playerName: string) => {
      setSelectedAIModels(models);
      
      // Map complicated model IDs to simple names for display in game
      const nameMapping: Record<string, string> = {
          'llama-3.3-70b-versatile': 'Llama 3.3',
          'llama-3.1-8b-instant': 'Llama 8B',
          'mixtral-8x7b-32768': 'Mixtral',
          'gemma2-9b-it': 'Gemma 2',
          'deepseek-r1-distill-llama-70b': 'DeepSeek R1',
          'qwen-2.5-32b': 'Qwen',
          'moonshot-v1-8k': 'Moonshot'
      };

      const aiNames = models.map(id => nameMapping[id] || id);

      // We need to re-create state. 
      // Since useReducer is static, we can dispatch a RESET action with new payload.
      // But creating the state requires the engine function.
      const newState = createInitialState([playerName, ...aiNames]);
      // We need an action to REPLACE state.
      // I'll update the reducer first.
      dispatch({ type: 'INIT_GAME', payload: newState });
      setSetupComplete(true);
  };

  if (!mounted) return null;

  return (
    <main className="flex min-h-screen flex-col items-center justify-start p-2 sm:p-4 md:p-8 bg-background overflow-x-hidden relative">
      {!setupComplete && (
          <SetupDialog onStart={handleStartGame} />
      )}
      
      {setupComplete && gameState && (
        <>
          <CardDrawOverlay gameState={gameState} onClose={() => dispatch({ type: 'DISMISS_POPUP' })} />
          <div className="animate-in fade-in duration-1000 w-full max-w-7xl flex flex-col lg:flex-row gap-3 sm:gap-4 lg:gap-8 items-start justify-center flex-1 min-h-0">
              <div className="w-full lg:flex-1 flex items-center justify-center p-1 sm:p-2">
                <Board gameState={gameState} onBuild={(propId) => dispatch({ type: 'BUILD', propertyId: propId })} />
              </div>

              <div className="w-full lg:w-[400px] xl:w-[450px] flex flex-col">
                <GameOverlay 
                    gameState={gameState} 
                    onRoll={() => dispatch({ type: 'ROLL' })}
                    onBuy={() => dispatch({ type: 'BUY' })}
                    onPass={() => dispatch({ type: 'PASS' })}
                    onNextTurn={() => dispatch({ type: 'NEXT' })}
                    onChat={(msg) => dispatch({ type: 'CHAT', sender: 'Human', message: msg, color: gameState.players[0].color })}
                    onTradeClick={() => setIsTradeOpen(true)}
                    onPayFine={() => dispatch({ type: 'PAY_JAIL_FINE' })}
                />
              </div>
          </div>
          
          <TradeDialog 
            gameState={gameState} 
            open={isTradeOpen} 
            onOpenChange={setIsTradeOpen}
            onTrade={(targetId, offer, propId, offPropId) => dispatch({ type: 'TRADE', targetPlayerId: targetId, offer, propertyId: propId, offeringPropertyId: offPropId })}
          />
        </>
      )}
    </main>
  );
}
