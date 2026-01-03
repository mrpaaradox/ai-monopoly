import { GameState } from '@/lib/game/types';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';

interface CardDrawOverlayProps {
    gameState: GameState;
    onClose: () => void;
}

export function CardDrawOverlay({ gameState, onClose }: CardDrawOverlayProps) {
    const card = gameState.lastDrawnCard;
    const rent = gameState.lastRentPayment;
    const jailFine = gameState.lastJailFine;
    
    const [cardVisible, setCardVisible] = useState(false);
    const [rentVisible, setRentVisible] = useState(false);
    const [jailFineVisible, setJailFineVisible] = useState(false);

    // Card Visibility (Manual Close)
    useEffect(() => {
        if (card) {
            const timer = setTimeout(() => setCardVisible(true), 10);
            return () => clearTimeout(timer);
        } else {
            const timer = setTimeout(() => setCardVisible(false), 0);
            return () => clearTimeout(timer);
        }
    }, [card]);

    // Rent Visibility (Auto Close 4s)
    useEffect(() => {
        if (rent) {
            const showTimer = setTimeout(() => setRentVisible(true), 10);
            const hideTimer = setTimeout(() => setRentVisible(false), 4000);
            return () => {
                clearTimeout(showTimer);
                clearTimeout(hideTimer);
            };
        } else {
            const timer = setTimeout(() => setRentVisible(false), 0);
            return () => clearTimeout(timer); 
        }
    }, [rent]);

    // Jail Fine Visibility (Auto Close 4s)
    useEffect(() => {
        if (jailFine) {
            const showTimer = setTimeout(() => setJailFineVisible(true), 10);
            const hideTimer = setTimeout(() => setJailFineVisible(false), 4000);
            return () => {
                clearTimeout(showTimer);
                clearTimeout(hideTimer);
            };
        } else {
            const timer = setTimeout(() => setJailFineVisible(false), 0);
            return () => clearTimeout(timer); 
        }
    }, [jailFine]);

    if (!card && !rent && !jailFine) return null;

    // Render Card Overlay
    if (card && cardVisible) {
        // ... (existing card render logic unchanged) ...
        const isChance = card.type === 'CHANCE';
        return (
            <div className={`fixed inset-0 z-[100] flex items-center justify-center transition-opacity duration-300 opacity-100`}>
                <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
                <div className="animate-in zoom-in duration-300 relative z-10 w-[90%] max-w-sm">
                    <Card className={`
                        aspect-[2/3] flex flex-col items-center justify-center p-6 text-center shadow-2xl border-4
                        ${isChance 
                            ? 'bg-gradient-to-br from-orange-400 to-red-500 border-white text-white' 
                            : 'bg-gradient-to-br from-blue-400 to-indigo-500 border-white text-white'
                        }
                    `}>
                        <div className="text-4xl mb-4 opacity-50">
                            {isChance ? '?' : '📦'}
                        </div>
                        <CardTitle className="text-3xl font-black uppercase mb-8 tracking-widest drop-shadow-md">
                            {isChance ? 'CHANCE' : 'COMMUNITY CHEST'}
                        </CardTitle>
                        <CardContent className="p-0 mb-8 w-full">
                            <div className="bg-white/20 backdrop-blur-sm p-6 rounded-xl border border-white/30 shadow-inner w-full">
                                <p className="text-xl font-bold leading-relaxed drop-shadow-sm">
                                    {card.text}
                                </p>
                            </div>
                        </CardContent>
                        <button 
                            onClick={onClose}
                            className="px-8 py-3 bg-white text-black font-bold uppercase tracking-widest rounded-full shadow-lg hover:bg-slate-100 hover:scale-105 transition-all"
                        >
                            Continue
                        </button>
                    </Card>
                </div>
            </div>
        );
    }

    // Render Rent Notification
    if (rent && rentVisible) {
        // ... (existing rent render logic unchanged) ...
        const payer = gameState.players.find(p => p.id === rent.payerId);
        const payee = gameState.players.find(p => p.id === rent.payeeId);
        
        if (!payer || !payee) return null;

        return (
             <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[90] animate-in slide-in-from-top-4 fade-in duration-500 pointer-events-none">
                 <div className="bg-slate-900/90 backdrop-blur-md text-white px-8 py-4 rounded-2xl shadow-2xl border border-slate-700 flex flex-col items-center gap-2">
                     <div className="text-xs uppercase tracking-widest opacity-70">Payment Alert</div>
                     <div className="flex items-center gap-3 text-lg font-bold">
                         <span className="text-red-400">{payer.name}</span>
                         <ArrowRight className="w-4 h-4 text-slate-500" />
                         <span className="text-xl font-mono text-yellow-400 bg-yellow-400/10 px-2 py-0.5 rounded border border-yellow-400/20">${rent.amount}</span>
                         <ArrowRight className="w-4 h-4 text-slate-500" />
                         <span className="text-green-400">{payee.name}</span>
                     </div>
                 </div>
             </div>
        );
    }

    // Render Jail Fine Notification
    if (jailFine && jailFineVisible) {
        const payer = gameState.players.find(p => p.id === jailFine.payerId);
        
        if (!payer) return null;

        return (
             <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[90] animate-in slide-in-from-top-4 fade-in duration-500 pointer-events-none">
                 <div className="bg-slate-900/90 backdrop-blur-md text-white px-8 py-4 rounded-2xl shadow-2xl border border-slate-700 flex flex-col items-center gap-2">
                     <div className="text-xs uppercase tracking-widest opacity-70 text-orange-400">Jail Fine Paid</div>
                     <div className="flex items-center gap-3 text-lg font-bold">
                         <span className="text-red-400">{payer.name}</span>
                         <ArrowRight className="w-4 h-4 text-slate-500" />
                         <span className="text-xl font-mono text-yellow-400 bg-yellow-400/10 px-2 py-0.5 rounded border border-yellow-400/20">${jailFine.amount}</span>
                         <ArrowRight className="w-4 h-4 text-slate-500" />
                         <span className="text-green-400">Bank</span>
                     </div>
                 </div>
             </div>
        );
    }

    return null;
}

