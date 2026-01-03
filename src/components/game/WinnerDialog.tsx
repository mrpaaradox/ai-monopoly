import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from "@/components/ui/button";
import { GameState } from '@/lib/game/types';

interface WinnerDialogProps {
    gameState: GameState;
    onReset: () => void;
}

export function WinnerDialog({ gameState, onReset }: WinnerDialogProps) {
    if (!gameState.winner) return null;

    const winner = gameState.players.find(p => p.id === gameState.winner);

    if (!winner) return null;

    return (
        <Dialog open={true}>
            <DialogContent className="sm:max-w-[425px] border-4 border-yellow-500 bg-gradient-to-b from-yellow-50 to-white dark:from-slate-900 dark:to-slate-950">
                <DialogHeader>
                    <DialogTitle className="text-3xl font-black text-center text-yellow-600 dark:text-yellow-400 uppercase tracking-tighter">
                        🏆 Winner!
                    </DialogTitle>
                    <DialogDescription className="text-center text-lg">
                        Statistics
                    </DialogDescription>
                </DialogHeader>
                <div className="py-6 flex flex-col items-center gap-4">
                     <div className="w-24 h-24 rounded-full border-4 border-yellow-500 shadow-xl flex items-center justify-center text-4xl font-bold text-white mb-2" style={{ backgroundColor: winner.color }}>
                         {winner.name[0]}
                     </div>
                     <h2 className="text-2xl font-bold">{winner.name} won the game!</h2>
                     <p className="text-muted-foreground text-center">
                         All other players have gone bankrupt.
                     </p>
                     
                     <div className="grid grid-cols-2 gap-4 w-full mt-4">
                        <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-lg text-center">
                             <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total Assets</div>
                             <div className="text-xl font-bold font-mono">${winner.money + winner.properties.reduce((acc, pid) => acc + (gameState.board[pid].price || 0), 0)}</div>
                        </div>
                        <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-lg text-center">
                             <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Properties</div>
                             <div className="text-xl font-bold font-mono">{winner.properties.length}</div>
                        </div>
                     </div>
                </div>
                <DialogFooter className="sm:justify-center">
                    <Button size="lg" className="w-full sm:w-auto text-lg px-8 bg-green-600 hover:bg-green-700 font-bold" onClick={onReset}>
                        Start New Game
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
