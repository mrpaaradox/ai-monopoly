import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from "@/components/ui/button";
import { GameState } from '@/lib/game/types';

interface IncomingTradeDialogProps {
    gameState: GameState;
    onAccept: () => void;
    onReject: () => void;
    onCounter: () => void;
}

export function IncomingTradeDialog({ gameState, onAccept, onReject, onCounter }: IncomingTradeDialogProps) {
    const trade = gameState.pendingTrade;
    
    if (!trade) return null;

    const initiator = gameState.players.find(p => p.id === trade.initiatorId);
    const targetProp = gameState.board.find(t => t.id === trade.propertyId);
    const offeringProp = trade.offeringPropertyId ? gameState.board.find(t => t.id === trade.offeringPropertyId) : null;

    if (!initiator || !targetProp) return null;

    return (
        <Dialog open={true} onOpenChange={(open) => !open && onReject()}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Incoming Trade Offer</DialogTitle>
                    <DialogDescription>
                        {initiator.name} wants to make a deal.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    <div className="border p-4 rounded-lg bg-slate-50 dark:bg-slate-900">
                        <p className="text-sm font-semibold mb-2 text-center text-muted-foreground uppercase tracking-wider">They Want</p>
                        <div className="flex items-center justify-center gap-2">
                             <div className="font-bold text-lg">{targetProp.name}</div>
                             <div className="text-xs bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded text-muted-foreground">Est. ${targetProp.price}</div>
                        </div>
                    </div>
                    
                    <div className="flex items-center justify-center text-muted-foreground">
                        <span className="text-sm">for</span>
                    </div>

                    <div className="border p-4 rounded-lg bg-slate-50 dark:bg-slate-900">
                        <p className="text-sm font-semibold mb-2 text-center text-muted-foreground uppercase tracking-wider">They Offer</p>
                        <div className="flex flex-col items-center gap-2">
                             {offeringProp && (
                                <div className="flex items-center justify-center gap-2">
                                     <div className="font-bold text-lg">{offeringProp.name}</div>
                                </div>
                             )}
                             <div className="font-mono text-xl font-bold text-green-600 dark:text-green-500">
                                ${trade.offer} Cash
                             </div>
                        </div>
                    </div>
                </div>
                <DialogFooter className="flex-col sm:flex-row gap-2">
                    <Button variant="destructive" onClick={onReject}>Reject</Button>
                    <Button variant="outline" onClick={onCounter}>Counter Offer</Button>
                    <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={onAccept}>Accept Deal</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
