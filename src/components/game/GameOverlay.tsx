import { useRef, useEffect, useState } from 'react';
import { GameState } from '@/lib/game/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { Dice1, Dice2, Dice3, Dice4, Dice5, Dice6, Send, History, MessageSquare } from 'lucide-react';
import { getPlayerIcon } from '@/lib/game/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface GameOverlayProps {
  gameState: GameState;
  onRoll: () => void;
  onBuy: () => void;
  onPass: () => void;
  onNextTurn: () => void;
  onChat: (msg: string) => void;
  onTradeClick: () => void;
  onPayFine: () => void;
}

export function GameOverlay({ gameState, onRoll, onBuy, onPass, onNextTurn, onChat, onTradeClick, onPayFine }: GameOverlayProps) {
  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  const logsEndRef = useRef<HTMLDivElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [chatInput, setChatInput] = useState("");

  // ... (useEffects and canBuy logic preserved)

  // Auto-scroll logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [gameState.logs]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [gameState.chat]);

  const canBuy = gameState.gamePhase === 'ACTION' && 
                 ['PROPERTY', 'RAILROAD', 'UTILITY'].includes(gameState.board[currentPlayer.position].type) &&
                 !gameState.board[currentPlayer.position].ownerId;

  return (
    <div className="flex flex-col h-full gap-2 sm:gap-3 lg:gap-4 w-full lg:max-w-sm min-w-0">
        {/* Current Player Status */}
        <Card className="border-2" style={{ borderColor: currentPlayer.color }}>
            <CardHeader className="pb-1 sm:pb-2">
                <CardTitle className="flex justify-between items-center text-base sm:text-lg">
                    <span className="flex items-center gap-1.5 sm:gap-2">
                        <div className="p-0.5 sm:p-1 rounded bg-slate-800 text-white flex items-center justify-center">
                            {getPlayerIcon(gameState.currentPlayerIndex)}
                        </div>
                        <span className="truncate max-w-[120px] sm:max-w-none">{currentPlayer.name}</span>
                    </span>
                    <Badge variant="secondary" className="font-mono text-sm sm:text-base">${currentPlayer.money}</Badge>
                </CardTitle>
            </CardHeader>
            <CardContent className="pb-2 sm:pb-4">
                <div className="flex justify-between items-center mb-2 sm:mb-4 gap-2">
                   <div className="text-xs sm:text-sm text-muted-foreground p-1 bg-slate-100 dark:bg-slate-800 rounded px-2 truncate flex-1 min-w-0">
                      Pos: <span className="font-bold truncate">{gameState.board[currentPlayer.position].name}</span>
                   </div>
                   <div className="flex gap-1.5 sm:gap-2 items-center flex-shrink-0">
                      <div className="bg-slate-100 dark:bg-slate-800 p-1.5 sm:p-2 rounded text-base sm:text-xl font-bold font-mono flex gap-1 sm:gap-2 shadow-inner">
                          {gameState.dice.map((d, i) => {
                             const DIcon = [Dice1, Dice2, Dice3, Dice4, Dice5, Dice6][d - 1];
                             return <DIcon key={i} className={cn("w-4 h-4 sm:w-6 sm:h-6 text-slate-700 dark:text-slate-300", gameState.gamePhase === 'ROLL' ? "animate-pulse" : "animate-bounce duration-500")} />;
                          })}
                          <span className="ml-0.5 sm:ml-1 text-slate-400 text-sm sm:text-base">=</span>
                          <span className="text-sm sm:text-base">{gameState.dice[0] + gameState.dice[1]}</span>
                      </div>
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
                    {gameState.gamePhase === 'ROLL' && (
                        currentPlayer.isJailed ? (
                             <>
                                <Button onClick={onRoll} className="w-full bg-orange-600 hover:bg-orange-700 text-xs sm:text-sm py-2 sm:py-3" disabled={currentPlayer.isAI}>
                                    Attempt Doubles
                                </Button>
                                <Button onClick={onPayFine} variant="outline" className="w-full border-red-500 text-red-500 hover:bg-red-50 text-xs sm:text-sm py-2 sm:py-3" disabled={currentPlayer.isAI || currentPlayer.money < 50}>
                                    Pay Fine ($50)
                                </Button>
                             </>
                        ) : (
                            <Button onClick={onRoll} className="w-full col-span-2 py-4 sm:py-6 text-base sm:text-lg bg-blue-600 hover:bg-blue-700" disabled={currentPlayer.isAI}>
                                Roll Dice
                            </Button>
                        )
                    )}
                    
                    {gameState.gamePhase === 'ACTION' && (
                        <>
                           <Button onClick={onBuy} disabled={!canBuy || currentPlayer.isAI} variant={canBuy ? "default" : "outline"} className={cn("w-full transition-colors", canBuy ? "bg-green-600 hover:bg-green-600" : "")}>
                               {canBuy ? `Buy ($${gameState.board[currentPlayer.position].price})` : "Buy"}
                           </Button>
                           <Button onClick={onPass} variant="secondary" disabled={currentPlayer.isAI} className="w-full">
                               Skip
                           </Button>
                        </>
                    )}

                    {gameState.gamePhase === 'END_TURN' && (
                        <Button onClick={onNextTurn} className="w-full col-span-2 hover:bg-green-600" disabled={currentPlayer.isAI}>
                            End Turn
                        </Button>
                    )}
                    
                    <Button onClick={onTradeClick} variant="outline" className="w-full col-span-2 border-slate-300" disabled={currentPlayer.isAI}>
                        Trade Deals
                    </Button>
                </div>
            </CardContent>
        </Card>

        {/* Players List */}
        <Card className="flex-shrink-0 h-[140px] sm:h-[160px] lg:h-[200px] overflow-hidden flex flex-col">
            <CardHeader className="py-1.5 sm:py-2 bg-slate-50 dark:bg-slate-900 border-b flex-shrink-0">
                <CardTitle className="text-[0.65rem] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground">Players</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-1.5 sm:p-2 space-y-1.5 sm:space-y-2 custom-scrollbar min-h-0">
                {gameState.players.map((p, i) => {
                    const ownedProperties = gameState.board.filter(t => t.ownerId === p.id);
                    const propertiesByGroup = ownedProperties.reduce((acc, prop) => {
                        const group = prop.group || 'Other';
                        if (!acc[group]) acc[group] = [];
                        acc[group].push(prop);
                        return acc;
                    }, {} as Record<string, typeof ownedProperties>);

                    return (
                        <Popover key={p.id}>
                            <PopoverTrigger asChild>
                                <div className={cn("cursor-pointer flex justify-between items-center p-2 rounded-lg border transition-all hover:scale-[1.02]", p.id === currentPlayer.id ? "bg-accent border-primary/50 shadow-sm" : "bg-transparent border-transparent hover:bg-slate-50 dark:hover:bg-slate-900")}>
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full flex items-center justify-center shadow-sm" style={{ backgroundColor: p.color }}>
                                            {getPlayerIcon(i)}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className={cn("font-bold text-sm", p.id === currentPlayer.id && "text-primary")}>{p.name}</span>
                                            {p.isAI && <span className="text-[10px] uppercase font-bold text-slate-400">AI Logic</span>}
                                        </div>
                                    </div>
                                    <span className="font-mono text-sm font-bold bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">${p.money}</span>
                                </div>
                            </PopoverTrigger>
                            <PopoverContent className="w-64 p-0 overflow-hidden" side="right">
                                <div className="p-3 bg-slate-50 dark:bg-slate-900 border-b">
                                    <h4 className="font-bold flex items-center gap-2">
                                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: p.color }} />
                                        {p.name}&apos;s Portfolio
                                    </h4>
                                </div>
                                <div className="p-3 max-h-[300px] overflow-y-auto custom-scrollbar space-y-3">
                                    {ownedProperties.length === 0 ? (
                                        <div className="text-sm text-muted-foreground italic text-center py-4">
                                            No properties owned.
                                        </div>
                                    ) : (
                                        Object.entries(propertiesByGroup).map(([group, props]) => (
                                            <div key={group}>
                                                <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">{group}</div>
                                                <div className="space-y-1">
                                                    {props.map(prop => (
                                                        <div key={prop.id} className="text-xs bg-slate-100 dark:bg-slate-800 p-1.5 rounded flex justify-between items-center border border-slate-200 dark:border-slate-700">
                                                            <span>{prop.name}</span>
                                                            <div className="flex gap-0.5">
                                                                {/* Show houses if any */}
                                                                {[...Array(prop.houses || 0)].map((_, hi) => (
                                                                    <div key={hi} className={`w-1.5 h-1.5 rounded-full ${prop.houses === 5 ? 'bg-red-500' : 'bg-green-500'}`} />
                                                                ))}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </PopoverContent>
                        </Popover>
                    );
                })}
            </CardContent>
        </Card>

        {/* Game Log & Chat Tabs */}
        <Card className="flex-shrink-0 h-[300px] lg:h-[350px] flex flex-col overflow-hidden shadow-lg border-t-4 border-indigo-500">
            <Tabs defaultValue="chat" className="flex-1 flex flex-col h-full">
                <div className="px-2 sm:px-4 pt-1.5 sm:pt-2 bg-slate-50 dark:bg-slate-900 border-b flex-shrink-0">
                     <TabsList className="w-full grid grid-cols-2 h-8 sm:h-10">
                        <TabsTrigger value="chat" className="flex gap-1 sm:gap-2 text-xs sm:text-sm"><MessageSquare className="w-3 h-3 sm:w-4 sm:h-4"/> Chat</TabsTrigger>
                        <TabsTrigger value="logs" className="flex gap-1 sm:gap-2 text-xs sm:text-sm"><History className="w-3 h-3 sm:w-4 sm:h-4"/> Events</TabsTrigger>
                     </TabsList>
                </div>

                {/* CHAT TAB */}
                <TabsContent value="chat" className="flex-1 flex flex-col p-0 m-0 min-h-0">
                    <div className="flex-1 p-3 sm:p-4 overflow-y-auto custom-scrollbar bg-slate-50/50 dark:bg-slate-950/50 min-h-0">
                        <div className="flex flex-col gap-2 sm:gap-3">
                             {gameState.chat.length === 0 && (
                                 <div className="text-center text-xs text-muted-foreground italic mt-10">
                                     Start the conversation...
                                 </div>
                             )}
                             {gameState.chat.map((msg, i) => (
                                 <div key={`chat-${i}`} className={cn("flex gap-2 items-end animate-in slide-in-from-bottom-2 duration-300", msg.sender === gameState.players[0].name ? "flex-row-reverse" : "")}>
                                     <div className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-[0.6rem] font-bold text-white shadow-sm ring-2 ring-white" style={{ backgroundColor: msg.color }}>
                                         {msg.sender[0]}
                                     </div>
                                     <div className={cn("flex flex-col max-w-[85%]", msg.sender === gameState.players[0].name ? "items-end" : "items-start")}>
                                         <span className="text-[0.55rem] font-bold text-slate-400 mb-0.5 px-1">{msg.sender}</span>
                                         <div className={cn("p-2.5 rounded-2xl text-xs shadow-md border", 
                                             msg.sender === gameState.players[0].name 
                                             ? "bg-blue-600 text-white rounded-br-none border-blue-700" 
                                             : "bg-white dark:bg-slate-800 rounded-bl-none border-slate-200 dark:border-slate-700"
                                         )}>
                                             {msg.message}
                                         </div>
                                     </div>
                                 </div>
                             ))}
                             <div ref={chatEndRef} />
                        </div>
                    </div>
                    {/* Chat Input */}
                    <div className="p-2 sm:p-3 border-t bg-white dark:bg-slate-900 flex gap-2 items-center flex-shrink-0">
                        <Input 
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            placeholder="Message everyone..." 
                            className="h-8 sm:h-9 text-xs flex-1" 
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && chatInput.trim()) {
                                    onChat(chatInput);
                                    setChatInput("");
                                }
                            }}
                        />
                        <Button size="icon" className="h-8 w-8 sm:h-9 sm:w-9 bg-indigo-600 hover:bg-indigo-700" onClick={() => {
                            if (chatInput.trim()) {
                                onChat(chatInput);
                                setChatInput("");
                            }
                        }}>
                            <Send className="w-3 h-3 sm:w-4 sm:h-4" />
                        </Button>
                    </div>
                </TabsContent>

                {/* EVENTS TAB */}
                <TabsContent value="logs" className="flex-1 p-0 m-0 min-h-0">
                     <div className="h-full p-3 sm:p-4 overflow-y-auto custom-scrollbar font-mono text-xs space-y-1.5 bg-slate-50 dark:bg-slate-950">
                         {gameState.logs.map((log, i) => (
                            <div key={`log-${i}`} className="py-2 px-3 border-l-4 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-r shadow-sm">
                                <span className="text-slate-500 mr-2 text-[0.6rem] uppercase tracking-wider">{i+1}</span>
                                {log}
                            </div>
                         ))}
                         <div ref={logsEndRef} />
                     </div>
                </TabsContent>
            </Tabs>
        </Card>
    </div>
  );
}
