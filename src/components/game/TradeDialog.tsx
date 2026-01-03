import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from "@/components/ui/button";
import { GameState } from '@/lib/game/types';
import { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface TradeDialogProps {
    gameState: GameState;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onTrade: (targetPlayerId: string, offerMoney: number, requestingPropertyId: number, offeringPropertyId: number | null) => void;
}

export function TradeDialog({ gameState, open, onOpenChange, onTrade }: TradeDialogProps) {
    const humanity = gameState.players[0]; // P0 is human
    const [targetPlayerId, setTargetPlayerId] = useState<string>('');
    const [selectedProperty, setSelectedProperty] = useState<string>('');
    const [offeringProperty, setOfferingProperty] = useState<string>('none');
    const [offerAmount, setOfferAmount] = useState<string>('0');
    
    // Get owned properties of the selected target
    const targetProperties = targetPlayerId 
        ? gameState.board.filter(t => t.ownerId === targetPlayerId && ['PROPERTY', 'RAILROAD', 'UTILITY'].includes(t.type))
        : [];

    // Get my properties (Human)
    const myProperties = gameState.board.filter(t => t.ownerId === humanity.id && ['PROPERTY', 'RAILROAD', 'UTILITY'].includes(t.type));

    const handleTrade = () => {
        if (!targetPlayerId || !selectedProperty) return;
        const offPropId = offeringProperty === 'none' ? null : parseInt(offeringProperty);
        onTrade(targetPlayerId, parseInt(offerAmount || '0'), parseInt(selectedProperty), offPropId);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Trade Negotiations</DialogTitle>
                    <DialogDescription>
                        Offer cash and/or properties to make a deal.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-6 py-4">
                    {/* Target Player */}
                    <div className="grid grid-cols-4 items-center gap-4">
                        <label className="text-right text-sm font-medium text-muted-foreground">Partner</label>
                        <Select onValueChange={setTargetPlayerId} value={targetPlayerId}>
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Select trade partner" />
                            </SelectTrigger>
                            <SelectContent>
                                {gameState.players
                                    .filter(p => p.id !== humanity.id)
                                    .map(p => {
                                        const isBlacklisted = humanity.tradeBlacklist?.includes(p.id);
                                        const isBankrupt = p.isBankrupt;
                                        return (
                                            <SelectItem 
                                                key={p.id} 
                                                value={p.id} 
                                                disabled={isBlacklisted || isBankrupt}
                                            >
                                                {p.name} 
                                                {isBankrupt ? " (Bankrupt)" : 
                                                 isBlacklisted ? " (Refuses Deals)" : 
                                                 ` (Cards: ${p.properties.length}, Cash: $${p.money})`}
                                            </SelectItem>
                                        );
                                })}
                            </SelectContent>
                        </Select>
                    </div>
                    
                    {/* Their Property */}
                    <div className="grid grid-cols-4 items-center gap-4">
                        <label className="text-right text-sm font-medium text-muted-foreground">Gets</label>
                        <Select onValueChange={setSelectedProperty} value={selectedProperty} disabled={!targetPlayerId}>
                            <SelectTrigger className="col-span-3 focus:ring-blue-500">
                                <SelectValue placeholder={targetProperties.length ? "Select their property" : "No properties available"} />
                            </SelectTrigger>
                            <SelectContent>
                                {targetProperties.map(t => (
                                    <SelectItem key={t.id} value={t.id.toString()}>
                                        {t.name} (Value: ${t.price})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="border-t my-2" />

                    {/* My Property Offer */}
                    <div className="grid grid-cols-4 items-center gap-4">
                        <label className="text-right text-sm font-medium text-muted-foreground">Offers</label>
                        <Select onValueChange={setOfferingProperty} value={offeringProperty}>
                            <SelectTrigger className="col-span-3 focus:ring-green-500">
                                <SelectValue placeholder="Offer a property (Optional)" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">-- No Property --</SelectItem>
                                {myProperties.map(t => (
                                    <SelectItem key={t.id} value={t.id.toString()}>
                                        {t.name} (Value: ${t.price})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Cash Offer */}
                    <div className="grid grid-cols-4 items-center gap-4">
                        <label className="text-right text-sm font-medium text-muted-foreground">Cash ($)</label>
                        <input 
                            type="number" 
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 col-span-3"
                            value={offerAmount}
                            onChange={(e) => setOfferAmount(e.target.value)}
                            min={0}
                            max={humanity.money}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="secondary" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleTrade} disabled={!selectedProperty || !targetPlayerId}>Propose Deal</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
