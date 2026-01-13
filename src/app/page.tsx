"use client";

import { useEffect, useReducer, useState } from "react";
import { createInitialState, rollDice, buyProperty, skipBuy, nextTurn, buildHouse, payJailFine, executeTrade } from "@/lib/game/engine";

import { GameState } from "@/lib/game/types";
import { Board } from "@/components/game/Board";
import { GameOverlay } from "@/components/game/GameOverlay";
import { TradeDialog } from "@/components/game/TradeDialog";
import { SetupDialog } from "@/components/game/SetupDialog";
import { CardDrawOverlay } from "@/components/game/CardDrawOverlay";
import { IncomingTradeDialog } from "@/components/game/IncomingTradeDialog";
import { BailoutDialog } from "@/components/game/BailoutDialog";
import { WinnerDialog } from "@/components/game/WinnerDialog";

// Reducer to handle state transitions
type Action = 
  | { type: 'INIT_GAME'; payload: GameState }
  | { type: 'ROLL' }
  | { type: 'BUY' }
  | { type: 'PASS' }
  | { type: 'NEXT' }
  | { type: 'BUILD'; propertyId: number }
  | { type: 'TRADE'; initiatorId: string; targetPlayerId: string; offer: number; propertyId: number; offeringPropertyId: number | null }
  | { type: 'RESOLVE_TRADE'; accepted: boolean; isCounter?: boolean }
  | { type: 'DISMISS_POPUP' }
  | { type: 'CHAT'; sender: string; message: string; color: string }
  | { type: 'PAY_JAIL_FINE' }

  | { type: 'REQUEST_BAILOUT'; playerId: string }
  | { type: 'RESOLVE_BAILOUT'; accepted: boolean }
  | { type: 'BANKRUPTCY'; playerId: string };

const gameReducer = (state: GameState | null, action: Action): GameState | null => {
  switch (action.type) {
    case 'INIT_GAME': return action.payload;
    case 'ROLL': return state ? rollDice(state) : null;
    case 'BUY': return state ? buyProperty(state) : null;
    case 'PASS': return state ? skipBuy(state) : null;
    case 'BUILD': return state ? buildHouse(state, action.propertyId) : null;
    case 'PAY_JAIL_FINE': return state ? payJailFine(state) : null;
    case 'BANKRUPTCY': {
        if (!state) return null;
        const bankruptPlayer = state.players.find(p => p.id === action.playerId);
        if (!bankruptPlayer) return state;

        // Reset properties of bankrupt player
        const updatedBoard = state.board.map(t => {
            if (t.ownerId === bankruptPlayer.id) {
                return { ...t, ownerId: undefined, houses: 0 };
            }
            return t;
        });

        const updatedPlayers = state.players.map(p => {
             if (p.id === bankruptPlayer.id) {
                 return { ...p, money: 0, isJailed: false, position: 0, properties: [], isBankrupt: true }; 
             }
             return p;
        });
        
        return {
            ...state,
            players: updatedPlayers,
            board: updatedBoard,
            logs: [...state.logs, `${bankruptPlayer.name} declared bankruptcy!`],
            chat: [...state.chat, { sender: 'System', message: `${bankruptPlayer.name} has gone bankrupt and is disqualified!`, color: '#ef4444' }]
        };
    }

    case 'REQUEST_BAILOUT': {
         if (!state) return null;
         return { ...state, pendingBailout: { playerId: action.playerId } };
    }

    case 'RESOLVE_BAILOUT': {
        if (!state || !state.pendingBailout) return state;
        const player = state.players.find(p => p.id === state.pendingBailout!.playerId);
        if (!player) return { ...state, pendingBailout: undefined };
        
        if (action.accepted) {
            // Bailout logic
            const updatedPlayers = state.players.map(p => {
                if (p.id === player.id) {
                    return { ...p, money: 500, bailoutCount: (p.bailoutCount || 0) + 1 };
                }
                return p;
            });
            return {
                ...state,
                players: updatedPlayers,
                pendingBailout: undefined,
                chat: [...state.chat, { sender: 'System', message: `${player.name} was bailed out! Recieved $500 stimulus. (${(player.bailoutCount || 0) + 1}/3)`, color: '#22c55e' }]
            };
        } else {
            // Rejected, proceed to Bankruptcy in next step or trigger it?
            // Since we can't dispatch inside reducer, we rely on the component or just assume rejection leads to bankruptcy manually.
            // But wait, if we are in this state, we need to transition. 
            // We can handle the "Bankrupt Effect" here directly or rely on a subsequent dispatch.
            // Let's handle it here to be safe, essentially calling the BANKRUPTCY logic (duplicating it slightly or abstracting it).
            // Actually, best to return state where pendingBailout is clear, and maybe a flag or just let the loop re-check?
            // If we clear pendingBailout, the loop might re-trigger REQUEST_BAILOUT if we don't disqualify.
            // So we MUST disqualify here if rejected.
            
            // Re-using Bankruptcy Logic
             const updatedBoard = state.board.map(t => {
                if (t.ownerId === player.id) {
                    return { ...t, ownerId: undefined, houses: 0 };
                }
                return t;
            });

            const updatedPlayers = state.players.map(p => {
                 if (p.id === player.id) {
                     return { ...p, money: 0, isJailed: false, position: 0, properties: [], isBankrupt: true }; 
                 }
                 return p;
            });

            return {
                ...state,
                players: updatedPlayers,
                board: updatedBoard,
                pendingBailout: undefined,
                logs: [...state.logs, `${player.name} was denied bailout and declared bankruptcy!`],
                chat: [...state.chat, { sender: 'System', message: `${player.name} denied bailout. Disqualified.`, color: '#ef4444' }]
            };
        }
    }

    case 'RESOLVE_TRADE': {
        if (!state) return null;
        if (!action.accepted) {
            // Rejected
            const trade = state.pendingTrade;
            if (!trade) return { ...state, pendingTrade: undefined };
            
            // If Countering, we don't blacklist and don't send rejection msg
            if (action.isCounter) {
                return { ...state, pendingTrade: undefined };
            }

            const initiator = state.players.find(p => p.id === trade.initiatorId);
            const randomMsg = ["Rejected.", "No deal.", "Maybe next time."];
            return { 
                ...state, 
                pendingTrade: undefined,
                players: state.players.map(p => {
                    // Initiator gets blocked from asking Target again (unless it was a counter, handled above)
                    if (p.id === initiator?.id) {
                         return { 
                             ...p, 
                             tradeBlacklist: [...(p.tradeBlacklist || []), trade.targetId] 
                         };
                    }
                    return p;
                }),
                chat: initiator ? [...state.chat, { sender: 'Human', message: randomMsg[Math.floor(Math.random() * randomMsg.length)], color: '#fff' }] : state.chat
            };
        }
        // Accepted
        if (!state.pendingTrade) return state;
        return executeTrade(state, state.pendingTrade);
    }
    case 'TRADE': 
        if (!state) return null;
        const target = state.players.find(p => p.id === action.targetPlayerId);
        const initiator = state.players.find(p => p.id === action.initiatorId);
        const targetProp = state.board.find(t => t.id === action.propertyId);
        const offeringProp = action.offeringPropertyId ? state.board.find(t => t.id === action.offeringPropertyId) : null;
        
        if (!target || !targetProp || !initiator) return state;

        // If Target is Human (Players[0]), we do NOT execute. We queue it.
        // Unless Initiator is Human (handled by TradeDialog usually, but if Human trades with Human? Not supported yet)
        // Initiator: AI, Target: Human
        if (!target.isAI && initiator.isAI) {
             return {
                 ...state,
                 pendingTrade: {
                     initiatorId: action.initiatorId,
                     targetId: action.targetPlayerId,
                     offer: action.offer,
                     propertyId: action.propertyId,
                     offeringPropertyId: action.offeringPropertyId
                 }
             };
        }
        
        let accepted = false;
        
        const targetValue = (targetProp.price || 0);
        
        let offerValue = action.offer;
        if (offeringProp) {
            offerValue += (offeringProp.price || 0); 
            const group = offeringProp.group;
            const aiPropsInGroup = target.properties.filter(pid => state.board[pid].group === group).length;
             if (aiPropsInGroup > 0) offerValue += 100; // Bonus if it completes/helps group
        }

        // Trading Logic Strategy 
        // Rule: "Models can't ask for more than 20%". We interpret this as acceptable offer cap.
        const minimumAcceptance = targetValue * 1.2;
        
        if (offerValue >= minimumAcceptance) {
             accepted = true;
        }

        // AI vs AI check
        if (initiator.isAI && target.isAI) {
             if (offerValue >= targetValue) accepted = true;
        }

        if (accepted) {
             if (initiator.money < action.offer) {
                 return { ...state, chat: [...state.chat, { sender: 'System', message: 'Trade failed: Insufficient funds.', color: '#999' }] };
             }
             return executeTrade(state, { 
                 initiatorId: action.initiatorId, 
                 targetId: action.targetPlayerId, 
                 offer: action.offer, 
                 propertyId: action.propertyId, 
                 offeringPropertyId: action.offeringPropertyId 
             });
        } else {
             // Rejection Logic
             if (initiator.isAI && target.isAI) {
                 // Block this AI from asking that AI again
                 const updatedPlayers = state.players.map(p => {
                     if (p.id === initiator.id) {
                         return { ...p, tradeBlacklist: [...(p.tradeBlacklist || []), target.id] };
                     }
                     return p;
                 });
                 return { ...state, players: updatedPlayers };
             } 

             const rejectMsg = [
                 `I can't accept that.`,
                 `Too low for ${targetProp.name}.`,
                 `I want to keep this property.`,
                 `No deal.`
             ];
             const randomMsg = rejectMsg[Math.floor(Math.random() * rejectMsg.length)];
             
             // Update initiator (which is human if we are here usually, but actually logic is shared)
             // If Initiator is Human, we block them from asking Target again?
             // "that person can't send a trade deal to that person again"
             // Yes, so if Human asks AI and AI rejects, Human is blocked from asking AI again.
             const updatedPlayers = state.players.map(p => {
                 if (p.id === initiator.id) {
                     return { ...p, tradeBlacklist: [...(p.tradeBlacklist || []), target.id] };
                 }
                 return p;
             });

             return { 
                 ...state, 
                 players: updatedPlayers,
                 chat: [...state.chat, { sender: target.name, message: randomMsg, color: target.color }] 
             };
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
  const [selectedAIModels, setSelectedAIModels] = useState<string[]>([]);
  const [groqApiKey, setGroqApiKey] = useState<string>('');
  const [playerModelMap, setPlayerModelMap] = useState<Record<string, string>>({});
  
  // Initialize with null
  const [gameState, dispatch] = useReducer(gameReducer, null);
  const [mounted, setMounted] = useState(false);
  const [isTradeOpen, setIsTradeOpen] = useState(false);

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
    
    // STALL: If trade is pending or bailout is pending or trade menu is open, pause AI.
    if (gameState.pendingTrade || gameState.pendingBailout || isTradeOpen) return;

    // ... (rest of AI loop) ...
     const timer = setTimeout(() => {
        if (gameState.gamePhase === 'ROLL') {
            dispatch({ type: 'ROLL' });
        } else if (gameState.gamePhase === 'ACTION') {
            const tile = gameState.board[currentPlayer.position];
            // AI Decision: Use Groq API for intelligent decisions
            if ((['PROPERTY', 'RAILROAD', 'UTILITY'].includes(tile.type)) && !tile.ownerId && tile.price) {
                // Get the model ID for this player
                const modelId = playerModelMap[currentPlayer.id] || 'llama-3.1-8b-instant';
                
                // Call Groq API for decision
                fetch('/api/ai-decision', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        apiKey: groqApiKey,
                        action: 'BUY_DECISION',
                        context: {
                            gameState,
                            player: currentPlayer,
                            currentTile: tile,
                            modelId
                        }
                    })
                })
                .then(res => res.json())
                .then(data => {
                    if (data.decision === 'BUY') {
                        dispatch({ type: 'BUY' });
                        dispatch({ 
                            type: 'CHAT', 
                            sender: currentPlayer.name, 
                            message: data.reasoning || `Buying ${tile.name}!`, 
                            color: currentPlayer.color 
                        });
                    } else {
                        dispatch({ type: 'PASS' });
                        dispatch({ 
                            type: 'CHAT', 
                            sender: currentPlayer.name, 
                            message: data.reasoning || `Passing on ${tile.name}.`, 
                            color: currentPlayer.color 
                        });
                    }
                })
                .catch(error => {
                    console.error('AI decision error:', error);
                    // Fallback to simple logic
                    if (currentPlayer.money >= (tile.price || 0) + 50) {
                        dispatch({ type: 'BUY' });
                    } else {
                        dispatch({ type: 'PASS' });
                    }
                });
            } else {
                 dispatch({ type: 'PASS' });
            }
        } else if (gameState.gamePhase === 'END_TURN') {
            // Check Bankruptcy
            // Check Bankruptcy
            if (currentPlayer.money < 200) {
                 if (currentPlayer.isAI && (currentPlayer.bailoutCount || 0) < 3) {
                     // Request Bailout
                     // Only request if not already requested effectively (though Phase usually blocks duplicates if we change phase, but we aren't changing phase)
                     // Effectively, we need to check if pendingBailout is already set
                     if (!gameState.pendingBailout) {
                        dispatch({ type: 'REQUEST_BAILOUT', playerId: currentPlayer.id });
                     }
                     // Pause loop until resolved
                     return;
                 } else {
                     dispatch({ type: 'BANKRUPTCY', playerId: currentPlayer.id });
                     dispatch({ type: 'NEXT' });
                     return;
                 }
            }

            // Anti-Loop: Check if we just got rejected in trade
            const lastMsg = gameState.chat[gameState.chat.length - 1];
            // If last message was a rejection (heuristic based on strings in reducer)
            if (lastMsg && (
                lastMsg.message.includes("No deal") || 
                lastMsg.message.includes("can't accept") ||
                lastMsg.message.includes("Too low")
            )) {
                // Determine if it was directed at us? 
                // Implicitly yes, since we are the active player in END_TURN loop.
                dispatch({ type: 'NEXT' });
                return;
            }

            // AI Trading Logic: Try to complete sets
            const ownedProps = currentPlayer.properties.map(id => gameState.board[id]);
            const groups = [...new Set(ownedProps.map(p => p.group).filter(g => g))];
            
            let traded = false;
            for (const group of groups) {
                 if (!group) continue;
                 const groupProps = gameState.board.filter(t => t.group === group);
                 const ownedInGroup = groupProps.filter(t => t.ownerId === currentPlayer.id);
                 const missingInGroup = groupProps.filter(t => t.ownerId !== currentPlayer.id);
                 
                 // If we have some, try to get the rest
                 if (ownedInGroup.length > 0 && missingInGroup.length > 0) {
                      for (const targetProp of missingInGroup) {
                           if (!targetProp.ownerId) continue; // Unowned, can't trade (buy phase mostly)
                           const owner = gameState.players.find(p => p.id === targetProp.ownerId);
                           if (!owner || owner.id === currentPlayer.id) continue;
                           
                           // Check Blacklist
                           if (currentPlayer.tradeBlacklist?.includes(owner.id)) continue;

                           // Propose Trade
                           // Logic: "Models can't ask for more than 20% of the house price". 
                           // We interpret as: The VALUE we offer shouldn't be too crazy high/low? 
                           // Or ASK logic. Here we are Inititator. We are "Asking" for `targetProp`. 
                           // We offer Money. 
                           // Limiting the "Ask": Maybe we can't ask for properties that are too expensive if we don't offer enough?
                           // Let's implement reasonable offer.
                           // Offer = Property Price * 1.1 to 1.2
                           const offerAmount = Math.floor((targetProp.price || 0) * 1.1);
                           
                           // Constraint: Cap at 20% markup if that's the rule
                           const maxOffer = (targetProp.price || 0) * 1.2;
                           const currentOffer = Math.min(offerAmount, maxOffer);

                           if (currentPlayer.money >= currentOffer + 50) {
                                dispatch({ type: 'TRADE', initiatorId: currentPlayer.id, targetPlayerId: owner.id, offer: currentOffer, propertyId: targetProp.id, offeringPropertyId: null });
                                traded = true;
                                break;
                           }
                      }
                 }
                 if (traded) break;
            }


            // Build Logic
            const updatedOwnedProps = currentPlayer.properties.map(id => gameState.board[id]);
            const updatedGroups = [...new Set(updatedOwnedProps.map(p => p.group).filter(g => g))];
            
            let built = false;
            for (const group of updatedGroups) {
                if (!group) continue;
                const groupProps = gameState.board.filter(t => t.group === group);
                const hasMonopoly = groupProps.every(t => t.ownerId === currentPlayer.id);
                
                if (hasMonopoly) {
                    for (const prop of groupProps) {
                        // Strict check: Must be PROPERTY and have a valid houseCost > 0
                        if (prop.type === 'PROPERTY' && (prop.houseCost || 0) > 0) {
                             // Aggressively build if we have monopoly. Keep only $100 buffer.
                            if (currentPlayer.money > (prop.houseCost || 0) + 100 && (prop.houses || 0) < 5) {
                                dispatch({ type: 'BUILD', propertyId: prop.id });
                                dispatch({ type: 'CHAT', sender: currentPlayer.name, message: `Building a house on ${prop.name}. Monopoly power!`, color: currentPlayer.color });
                                built = true;
                                break; 
                            }
                        }
                    }
                }
                if (built) break;
            }

            if (!built && !traded) {
                dispatch({ type: 'NEXT' });
            } 
        }
    }, AI_DELAY);
    return () => clearTimeout(timer);
  }, [gameState, setupComplete, isTradeOpen, groqApiKey, playerModelMap]);


  
  // Custom Reducer with replacement capability
  // Actually, standard reducer with INIT action is cleaner.
  /* 
     Note: I need to update the reducer definition above to handle INIT_GAME
  */
  
  const handleStartGame = (models: string[], playerName: string, apiKey: string) => {
      setSelectedAIModels(models);
      setGroqApiKey(apiKey);
      
      // Map complicated model IDs to simple names for display in game
      const nameMapping: Record<string, string> = {
          'llama-3.3-70b-versatile': 'Llama 3.3',
          'llama-3.1-8b-instant': 'Llama 8B',
          'mixtral-8x7b-32768': 'Mixtral',
          'gemma2-9b-it': 'Gemma 2',
          'qwen-qwq-32b': 'Qwen QwQ',
          'moonshotai/Kimi-K2-Instruct-0905': 'Kimi K2',
      };

      const aiNames = models.map(id => nameMapping[id] || id);

      // We need to re-create state. 
      // Since useReducer is static, we can dispatch a RESET action with new payload.
      // But creating the state requires the engine function.
      const newState = createInitialState([playerName, ...aiNames]);
      
      // Create mapping of player ID to model ID
      const modelMap: Record<string, string> = {};
      newState.players.forEach((player, index) => {
          if (player.isAI && index > 0) {
              // Map AI players to their respective models
              modelMap[player.id] = models[index - 1] || 'llama-3.1-8b-instant';
          }
      });
      setPlayerModelMap(modelMap);
      
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
            onTrade={(targetId, offer, propId, offPropId) => dispatch({ type: 'TRADE', initiatorId: gameState.players[0].id, targetPlayerId: targetId, offer, propertyId: propId, offeringPropertyId: offPropId })}
          />
          
          <IncomingTradeDialog 
              gameState={gameState}
              onAccept={() => dispatch({ type: 'RESOLVE_TRADE', accepted: true })}
              onReject={() => dispatch({ type: 'RESOLVE_TRADE', accepted: false })}
              onCounter={() => {
                  // Pass isCounter=true to suppress "No Deal" and Blacklist
                  dispatch({ type: 'RESOLVE_TRADE', accepted: false, isCounter: true }); 
                  setIsTradeOpen(true); // Open general trade dialog
                  // Note: Ideally we'd pre-select the AI player
              }}
          />

          <BailoutDialog 
            gameState={gameState} 
            onAccept={() => {
                dispatch({ type: 'RESOLVE_BAILOUT', accepted: true });
                // We need to tell AI to continue turning? 
                // AI loop depends on gamePhase. If we just updated money, AI loop will re-run and see money > 200 and proceed.
            }}
            onReject={() => {
                dispatch({ type: 'RESOLVE_BAILOUT', accepted: false });
                dispatch({ type: 'NEXT' }); // End their turn after disqualification
            }}
          />

          <WinnerDialog 
             gameState={gameState} 
             onReset={() => {
                 setSetupComplete(false); // Go back to setup
                 // dispatch({ type: 'INIT_GAME', payload: ... }) will happen in handleStart
             }} 
          />
        </>
      )}
    </main>
  );
}
