import { Tile, Player } from '@/lib/game/types';
import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface TileProps {
  tile: Tile;
  players: (Player & { icon?: ReactNode })[];
  className?: string;
  style?: React.CSSProperties;
}

const GROUP_COLORS: Record<string, string> = {
  'Brown': 'bg-[#8B4513]',
  'LightBlue': 'bg-[#87CEEB]',
  'Pink': 'bg-[#FF69B4]',
  'Orange': 'bg-[#FFA500]',
  'Red': 'bg-[#FF0000]',
  'Yellow': 'bg-[#FFD700]',
  'Green': 'bg-[#008000]',
  'DarkBlue': 'bg-[#00008B]',
  'Railroad': 'bg-black',
  'Utility': 'bg-gray-500',
};

export function TileComponent({ tile, players, className, style }: TileProps) {

  // Group Color Bar
  const colorClass = tile.group ? GROUP_COLORS[tile.group] : null;
  
  // Dynamic Background based on type
  let bgClass = "bg-card";
  if (tile.type === 'GO' || tile.type === 'GO_TO_JAIL' || tile.type === 'JAIL' || tile.type === 'FREE_PARKING') {
      bgClass = "bg-slate-100 dark:bg-slate-900";
  }

  return (
    <div 
      style={style}
      className={cn(
        "relative flex flex-col items-center justify-between border border-slate-300 dark:border-slate-700 text-[0.5rem] sm:text-[0.6rem] md:text-[0.7rem] font-medium shadow-sm active:scale-95 transition-all overflow-hidden rounded-sm",
        bgClass,
        className
      )}
    >
      {/* Group Color Indicator */}
      {colorClass && (
        <div className={cn("w-full h-1/5 min-h-[0.8em] sm:min-h-[1em] md:min-h-[1.2em] border-b border-black/5 shadow-inner", colorClass, "transition-all")} />
      )}
      
      {/* Content */}
      <div className="flex flex-col items-center justify-center flex-1 w-full p-0.5 sm:p-1 text-center leading-tight">
        {tile.type === 'COMMUNITY_CHEST' && (
             <div className="flex flex-col items-center gap-1">
                 <div className="p-1 bg-amber-100 rounded-full dark:bg-amber-900/30"><div className="w-4 h-4 text-amber-600 dark:text-amber-500 font-bold flex items-center justify-center border border-amber-600 rounded-md">C</div></div>
                 <span className="text-[0.55rem] font-bold text-amber-800 dark:text-amber-400">CHEST</span>
             </div>
        )}
        {tile.type === 'CHANCE' && (
             <div className="flex flex-col items-center gap-1">
                 <div className="text-lg font-serif font-bold text-blue-500">?</div>
                 <span className="text-[0.55rem] font-bold text-blue-600 dark:text-blue-400">CHANCE</span>
             </div>
        )}
        {tile.type === 'UTILITY' && (
             <span className="font-bold tracking-tight text-slate-600 dark:text-slate-400 uppercase scale-90">{tile.name}</span>
        )}
        
        {tile.type === 'GO' && (
             <div className="flex flex-col items-center justify-center w-full h-full relative">
                 <span className="text-[2rem] font-black text-slate-900 dark:text-white leading-none z-10">GO</span>
                 <div className="text-[0.6rem] font-bold text-slate-500 uppercase tracking-widest mb-1 z-10">Collect $200</div>
                 {/* Red Arrow */}
                 <div className="absolute inset-0 flex items-center justify-center opacity-10">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-16 h-16 -rotate-90 text-red-600">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                 </div>
             </div>
        )}
        
        {['PROPERTY', 'JAIL', 'GO_TO_JAIL', 'TAX', 'FREE_PARKING', 'RAILROAD'].includes(tile.type) && (
            <span className={cn(
                "break-words w-full px-0.5 font-bold tracking-tight leading-[0.85] sm:leading-[0.8]", // Much tighter leading
                // Specific sizing for different types & known long names
                tile.type === 'GO_TO_JAIL' || tile.type === 'JAIL' || tile.name === 'Deported' ? "text-[0.4rem] sm:text-[0.45rem] font-black text-orange-600 uppercase" : 
                ['Argentina', 'Singapore', 'Shinkansen', 'Philippines', 'United Kingdom', 'United States', 'South Korea'].includes(tile.name) ? "text-[0.42rem] sm:text-[0.45rem] md:text-[0.5rem]" :
                // Dynamic sizing for properties/others based on length as fallback
                tile.name.length > 9 ? "text-[0.45rem] sm:text-[0.5rem] md:text-[0.55rem]" : "text-[0.5rem] sm:text-[0.6rem] md:text-[0.7rem]",
                "text-slate-800 dark:text-slate-200"
            )}>
              {tile.name === 'Deported' ? 'DEPORTED' : tile.type === 'RAILROAD' ? tile.name.replace('Railroad', 'RR') : tile.name}
            </span>
        )}
      </div>

      {/* Buildings Indicators - Modern Dots */}
      {tile.houses && tile.houses > 0 && (
         <div className="absolute top-[22%] w-full flex justify-center gap-0.5 px-1">
             {[...Array(tile.houses)].map((_, i) => (
                 <div key={i} className={cn(
                     "w-1.5 h-1.5 rounded-full border border-white shadow-sm transform transition-all",
                     tile.houses === 5 ? "w-2.5 h-1.5 bg-red-500 rounded-sm" : "bg-green-500"
                 )} />
             ))}
         </div>
      )}

      {/* Owner Marker - Subtle Corner Strip */}
      {tile.ownerId && (
        <div className="absolute top-0 right-0 w-3 h-3 overflow-hidden">
             <div className="absolute top-0 right-0 w-4 h-0.5 bg-black/80 rotate-45 transform origin-top-left translate-x-[4px] -translate-y-[1px]" /> 
             {/* Using player color border instead */}
        </div>
      )}
      {/* Better Owner Indication: Bottom border color? Or glow? */}
      {tile.ownerId && (
          <div className="absolute inset-0 border-2 border-transparent" style={{ borderColor: players.find(p => p.id === tile.ownerId)?.color + '40' }} />
      )}

      {/* Price Tag */}
      {tile.price && (
        <div className="w-full text-center pb-0.5 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-700">
            <div className="text-[0.45rem] sm:text-[9px] font-mono font-bold text-slate-600 dark:text-slate-300">
                ${tile.price}
            </div>
        </div>
      )}
    </div>
  );
}
