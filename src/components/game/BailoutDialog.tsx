import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from "@/components/ui/button";
import { GameState } from '@/lib/game/types';

interface BailoutDialogProps {
    gameState: GameState;
    onAccept: () => void;
    onReject: () => void;
}

export function BailoutDialog({ gameState, onAccept, onReject }: BailoutDialogProps) {
    const bailout = gameState.pendingBailout;
    
    if (!bailout) return null;

    const player = gameState.players.find(p => p.id === bailout.playerId);

    if (!player) return null;

    return (
        <Dialog open={true} onOpenChange={(open) => !open && onReject()}>
            <DialogContent className="sm:max-w-[425px] border-red-500 border-2">
                <DialogHeader>
                    <DialogTitle className="text-red-600 font-bold flex items-center gap-2">
                        ⚠️ BANKRUPTCY ALERT
                    </DialogTitle>
                    <DialogDescription>
                        {player.name} has run out of funds!
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    <p className="text-center text-lg">
                        They have used <span className="font-bold">{player.bailoutCount || 0}</span> / 3 bailouts.
                    </p>
                    <p className="text-center text-sm text-muted-foreground">
                        Do you want to bail them out with a $500 stimulus package?
                    </p>
                </div>
                <DialogFooter className="flex-col sm:flex-row gap-2">
                    <Button variant="destructive" onClick={onReject}>Let them Fail (Disqualify)</Button>
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={onAccept}>Bail Out ($500)</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
