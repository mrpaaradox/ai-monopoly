import { GameState } from '@/lib/game/types';
import { TileComponent } from './Tile';
import { cn } from '@/lib/utils';
import { Zap } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { getPlayerIcon } from '@/lib/game/utils';
import { CHANCE_CARDS, CHEST_CARDS } from '@/lib/game/engine';

interface BoardProps {
  gameState: GameState;
  onBuild: (propertyId: number) => void;
}

export function Board({ gameState, onBuild }: BoardProps) {
  // Map tile ID to grid position { row, col }
  // Grid is 1-indexed for CSS Grid: 1..11
  const getGridPos = (id: number) => {
    if (id === 0) return { r: 11, c: 11 };
    if (id < 10) return { r: 11, c: 11 - id };
    if (id === 10) return { r: 11, c: 1 };
    if (id < 20) return { r: 11 - (id - 10), c: 1 };
    if (id === 20) return { r: 1, c: 1 };
    if (id < 30) return { r: 1, c: 1 + (id - 20) };
    if (id === 30) return { r: 1, c: 11 };
    if (id < 40) return { r: 1 + (id - 30), c: 11 };
    return { r: 1, c: 1 };
  };

  const currentPlayer = gameState.players[gameState.currentPlayerIndex];

  return (
    <div className={cn("relative grid grid-cols-11 grid-rows-11 gap-[2px] sm:gap-0.5 w-full aspect-square max-w-[800px] border-[2px] sm:border-[3px] md:border-[12px] border-slate-900 bg-slate-900 dark:bg-slate-950 p-[2px] sm:p-0.5 md:p-1 shadow-xl md:shadow-2xl rounded-md sm:rounded-lg ring-1 sm:ring-2 md:ring-4 ring-slate-900/10", "")}>
      {/* Center Area */}
      <div className="row-start-2 row-end-[11] col-start-2 col-end-[11] flex flex-col items-center justify-center bg-white dark:bg-slate-900 m-1 sm:m-2 md:m-6 rounded-lg sm:rounded-2xl md:rounded-3xl border border-slate-200 sm:border-2 md:border-4 dark:border-slate-800 shadow-inner relative overflow-hidden group">
         <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5" />
         <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10" />
         
         <div className="relative z-10 flex flex-col items-center animate-in zoom-in duration-1000">
             <Zap className="w-6 h-6 sm:w-8 sm:h-8 md:w-12 md:h-12 lg:w-24 lg:h-24 text-indigo-500 mb-0.5 sm:mb-1 md:mb-2 lg:mb-4 drop-shadow-lg" />
             <h1 className="text-[0.65rem] leading-tight sm:text-lg md:text-2xl lg:text-4xl xl:text-6xl font-black tracking-tighter text-slate-900 dark:text-white uppercase -rotate-6 select-none text-center" style={{ textShadow: '2px 2px 0px rgba(0,0,0,0.1)' }}>
                Humans<br/><span className="text-[0.5rem] sm:text-sm md:text-xl lg:text-2xl xl:text-4xl text-slate-500">vs</span><br/>AI Monopoly
             </h1>
             <div className="mt-0.5 sm:mt-1 md:mt-3 lg:mt-6 flex gap-0.5 sm:gap-1 md:gap-2 lg:gap-3 items-center text-[0.35rem] sm:text-[0.5rem] md:text-[0.6rem] lg:text-sm font-mono text-muted-foreground uppercase tracking-widest bg-slate-100 dark:bg-slate-800 px-1 py-[1px] sm:px-1.5 sm:py-0.5 md:px-2 md:py-1 lg:px-4 lg:py-2 rounded-full border border-slate-200 dark:border-slate-700">
                <span className="w-0.5 h-0.5 sm:w-1 sm:h-1 md:w-1.5 md:h-1.5 lg:w-2 lg:h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                <span className="hidden sm:inline">World Edition</span>
                <span className="sm:hidden">World</span>
             </div>
         </div>
      </div>

      {/* Tiles */}
      {gameState.board.map((tile) => {
        const pos = getGridPos(tile.id);
        const playersHere = gameState.players.filter(p => p.position === tile.id);
        
        // Build Logic
        const isOwner = tile.ownerId === currentPlayer.id;
        const isCurrentPlayer = !currentPlayer.isAI; // Only human can click build manually
        
        // Check monopoly and funds
        let canBuild = false;
        if (isOwner && tile.group && tile.type === 'PROPERTY') {
            const groupProps = gameState.board.filter(t => t.group === tile.group);
            const hasMonopoly = groupProps.every(t => t.ownerId === currentPlayer.id);
            const canAfford = currentPlayer.money >= (tile.houseCost || 0);
            const notMaxed = (tile.houses || 0) < 5;
            canBuild = hasMonopoly && canAfford && notMaxed;
        }

        return (
          <div
            key={tile.id}
            className="group relative"
            style={{
              gridRow: pos.r,
              gridColumn: pos.c,
            }}
          >
           {/* Popover Logic */}
           <Popover>
            <PopoverTrigger asChild>
                <div className="w-full h-full cursor-pointer hover:z-50 hover:scale-105 transition-transform duration-200 relative">
                    <TileComponent 
                        tile={tile} 
                        players={playersHere} 
                        className="w-full h-full border border-slate-300 dark:border-slate-800 shadow-sm"
                    />
                    {isOwner && isCurrentPlayer && canBuild && (
                        <div className="absolute -top-1 -right-1 z-10 w-4 h-4 rounded-full bg-green-500 text-white flex items-center justify-center shadow-sm animate-bounce">
                            <Zap className="w-2.5 h-2.5 fill-current" />
                        </div>
                    )}
                </div>
            </PopoverTrigger>
            {/* ... Popover Content ... */}
            <PopoverContent side="top" className="w-80 p-0 overflow-hidden bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 shadow-xl rounded-xl">
                 <div className="p-4 bg-slate-50 dark:bg-slate-950/50 border-b border-slate-100 dark:border-slate-800">
                     <h3 className="font-bold text-lg">{tile.name}</h3>
                     <p className="text-xs text-muted-foreground uppercase tracking-widest">{tile.type}</p>
                 </div>
                 <div className="p-4 space-y-3">
                     {tile.ownerId && (
                        <div className="flex justify-between items-center text-xs p-2 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 mb-2">
                             <span className="font-semibold text-muted-foreground uppercase">Current Owner</span>
                             <span className="font-bold flex items-center gap-2">
                                  <div className="w-3 h-3 rounded-full ring-1 ring-slate-300 dark:ring-slate-600" style={{ backgroundColor: gameState.players.find(p => p.id === tile.ownerId)?.color }} />
                                  {gameState.players.find(p => p.id === tile.ownerId)?.name}
                             </span>
                        </div>
                     )}
                     {tile.type === 'PROPERTY' && (
                         <>
                             <div className="flex justify-between items-center text-sm">
                                 <span>Price</span>
                                 <span className="font-mono font-bold">${tile.price}</span>
                             </div>
                             <div className="space-y-1">
                                 <p className="text-xs font-semibold text-muted-foreground uppercase">Rent Information</p>
                                 <div className="flex justify-between text-xs"><span>Base Rent</span><span>${tile.rent?.[0]}</span></div>
                                 <div className="flex justify-between text-xs"><span>1 House</span><span>${tile.rent?.[1]}</span></div>
                                 <div className="flex justify-between text-xs"><span>2 Houses</span><span>${tile.rent?.[2]}</span></div>
                                 <div className="flex justify-between text-xs"><span>3 Houses</span><span>${tile.rent?.[3]}</span></div>
                                 <div className="flex justify-between text-xs"><span>4 Houses</span><span>${tile.rent?.[4]}</span></div>
                                 <div className="flex justify-between text-xs"><span>Hotel</span><span>${tile.rent?.[5]}</span></div>
                             </div>
                             <div className="pt-2 border-t mt-2">
                                <div className="flex justify-between text-xs font-medium">
                                    <span>House Cost</span>
                                    <span>${tile.houseCost}</span>
                                </div>
                             </div>
                             
                             {/* Build Action */}
                             {isOwner && isCurrentPlayer && canBuild && (
                                 <div className="pt-2">
                                      <button 
                                        onClick={() => onBuild(tile.id)}
                                        className="w-full py-1.5 rounded-md bg-green-600 hover:bg-green-700 text-white text-xs font-bold shadow-sm transition-colors"
                                      >
                                          Build House (${tile.houseCost})
                                      </button>
                                 </div>
                             )}
                         </>
                     )}
                     {tile.type === 'RAILROAD' && (
                         <>
                             <div className="flex justify-between items-center text-sm">
                                 <span>Base Fare</span>
                                 <span className="font-mono font-bold">$25</span>
                             </div>
                             <div className="space-y-1 mt-2">
                                 <p className="text-xs font-semibold text-muted-foreground uppercase">Metro Network Rates</p>
                                 <div className="flex justify-between text-xs"><span>1 Metro Owned</span><span>$25</span></div>
                                 <div className="flex justify-between text-xs"><span>2 Metros Owned</span><span>$50</span></div>
                                 <div className="flex justify-between text-xs"><span>3 Metros Owned</span><span>$100</span></div>
                                 <div className="flex justify-between text-xs"><span>4 Metros Owned</span><span>$200</span></div>
                             </div>
                         </>
                     )}
                     {tile.type === 'UTILITY' && (
                         <div className="space-y-2 text-xs">
                             <p>Rent depends on dice roll.</p>
                             <div className="flex justify-between"><span>1 Utility</span><span>4x Roll</span></div>
                             <div className="flex justify-between"><span>2 Utilities</span><span>10x Roll</span></div>
                         </div>
                     )}
                     {tile.type === 'CHANCE' && (
                         <div className="space-y-2 text-xs">
                             <p className="font-semibold text-muted-foreground uppercase mb-2">Possible Cards</p>
                             <div className="h-48 overflow-y-auto pr-2 space-y-1.5 custom-scrollbar">
                                 {CHANCE_CARDS.map((card, idx) => (
                                    <div key={idx} className="p-2 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 text-[0.65rem] leading-tight flex justify-between items-start gap-2">
                                        <span>{card.text}</span>
                                        {(card.effect === 'MONEY' || card.effect === 'MONEY_ALL') && card.amount && (
                                            <span className={`font-mono font-bold whitespace-nowrap ${card.amount > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                                {card.amount > 0 ? '+' : ''}{card.amount}
                                            </span>
                                        )}
                                        {card.effect === 'REPAIRS' && (
                                            <span className="font-mono font-bold text-orange-600 dark:text-orange-400 whitespace-nowrap">
                                                -{card.amount}/h
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    {tile.type === 'COMMUNITY_CHEST' && (
                        <div className="space-y-2 text-xs">
                            <p className="font-semibold text-muted-foreground uppercase mb-2">Possible Rewards/Fees</p>
                            <div className="h-48 overflow-y-auto pr-2 space-y-1.5 custom-scrollbar">
                                {CHEST_CARDS.map((card, idx) => (
                                    <div key={idx} className="p-2 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 text-[0.65rem] leading-tight flex justify-between items-start gap-2">
                                        <span>{card.text}</span>
                                        {(card.effect === 'MONEY' || card.effect === 'MONEY_ALL') && card.amount && (
                                            <span className={`font-mono font-bold whitespace-nowrap ${card.amount > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                                {card.amount > 0 ? '+' : ''}{card.amount}
                                            </span>
                                        )}
                                        {card.effect === 'REPAIRS' && (
                                            <span className="font-mono font-bold text-orange-600 dark:text-orange-400 whitespace-nowrap">
                                                -{card.amount}/h
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                         </div>
                     )}
                     {/* Placeholder for actions like Mortgage/Build if owner */}
                 </div>
            </PopoverContent>
           </Popover>
          </div>
        );
      })}

      {/* Token Layer for Animation */}
      <div className="absolute inset-0 pointer-events-none z-50">
          {gameState.players.map((p, i) => {
              const pos = getGridPos(p.position);
              
              // Calculate overlap offset
              const siblings = gameState.players.filter(pl => pl.position === p.position);
              const siblingIndex = siblings.findIndex(pl => pl.id === p.id);
              const totalSiblings = siblings.length;
              
              let translateX = 0;
              let translateY = 0;
              let scale = 1;
              
              if (totalSiblings > 1) {
                  // Distribute in a small circle/grid
                  const angle = (360 / totalSiblings) * siblingIndex;
                  const radius = 20; // 20% of cell size
                  if (totalSiblings === 2) {
                      // Just offset diagonal
                      translateX = siblingIndex === 0 ? -15 : 15;
                      translateY = siblingIndex === 0 ? -15 : 15;
                  } else {
                      // Circle
                      translateX = Math.cos(angle * Math.PI / 180) * radius;
                      translateY = Math.sin(angle * Math.PI / 180) * radius;
                  }
                  scale = 0.8; // Shrink slightly to fit
              }

              // 1 unit = 100/11 = 9.0909%
              const top = (pos.r - 1) * (100/11);
              const left = (pos.c - 1) * (100/11);
              
              return (
                  <div 
                    key={p.id}
                    className="absolute w-[9.09%] h-[9.09%] flex items-center justify-center transition-all duration-500 ease-in-out"
                    style={{
                        top: `${top}%`,
                        left: `${left}%`,
                        zIndex: 50 + i,
                        transform: `translate(${translateX}%, ${translateY}%) scale(${scale})`
                    }}
                  >
                        <div className="relative shadow-xl transition-transform hover:scale-125 hover:z-[100]">
                             <div className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center shadow-lg transform -translate-y-2 ring-1 ring-black/10" 
                                style={{ backgroundColor: p.color }}>
                                 {getPlayerIcon(i)}
                             </div>
                             {/* Token Base shadow */}
                             <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-1 bg-black/30 rounded-full blur-[1px]" />
                        </div>
                  </div>
              )
          })}
      </div>
    </div>
  );
}
