import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';

interface SetupDialogProps {
  onStart: (selectedModels: string[], playerName: string, apiKey: string, spectatorMode: boolean) => void;
}

const AVAILABLE_MODELS = [
  { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B', category: 'Meta' },
  { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B', category: 'Meta' },
  { id: 'openai/gpt-oss-120b', name: 'GPT-OSS 120B', category: 'OpenAI' },
  { id: 'openai/gpt-oss-20b', name: 'GPT-OSS 20B', category: 'OpenAI' },
];

export function SetupDialog({ onStart }: SetupDialogProps) {
    const [selectedModels, setSelectedModels] = useState<string[]>(['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'openai/gpt-oss-120b']);
    const [playerName, setPlayerName] = useState("Human");
    const [apiKey, setApiKey] = useState("");
    const [spectatorMode, setSpectatorMode] = useState(false);

    const maxModels = spectatorMode ? 4 : 3;

    const toggleModel = (id: string) => {
        if (selectedModels.includes(id)) {
            if (selectedModels.length > 1) {
                setSelectedModels(selectedModels.filter(m => m !== id));
            }
        } else {
            if (selectedModels.length < maxModels) {
                setSelectedModels([...selectedModels, id]);
            }
        }
    };

    const handleSpectatorToggle = () => {
        const newSpectatorMode = !spectatorMode;
        setSpectatorMode(newSpectatorMode);
        
        // Adjust model selection when toggling
        if (newSpectatorMode && selectedModels.length === 3) {
            // Switching to spectator mode - add 4th model if available
            const unselected = AVAILABLE_MODELS.find(m => !selectedModels.includes(m.id));
            if (unselected) {
                setSelectedModels([...selectedModels, unselected.id]);
            }
        } else if (!newSpectatorMode && selectedModels.length === 4) {
            // Switching back to normal mode - remove last model
            setSelectedModels(selectedModels.slice(0, 3));
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
            <Card className="w-full max-w-2xl border-2 border-indigo-500 shadow-2xl bg-white dark:bg-slate-950">
                <CardHeader className="text-center pb-2">
                    <CardTitle className="text-3xl font-black uppercase tracking-tighter text-indigo-600 dark:text-indigo-400">
                        Mission Setup
                    </CardTitle>
                    <CardDescription className="text-lg">
                        {spectatorMode ? 'Watch AI agents battle' : 'Configure your identity and opponents'}
                    </CardDescription>
                </CardHeader>
                <CardContent className="py-6 space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-bold uppercase tracking-wide text-muted-foreground">Groq API Key</label>
                        <Input 
                            type="password"
                            value={apiKey} 
                            onChange={(e) => setApiKey(e.target.value)} 
                            className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-lg font-mono"
                            placeholder="gsk_..."
                        />
                        <p className="text-xs text-muted-foreground">
                            Get your free API key at <a href="https://console.groq.com" target="_blank" rel="noopener noreferrer" className="text-indigo-500 hover:underline">console.groq.com</a>
                        </p>
                    </div>

                    {/* Spectator Mode Toggle */}
                    <div className="flex items-center justify-between p-4 rounded-xl border-2 border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-900/20">
                        <div>
                            <div className="font-bold text-sm md:text-base">🎭 Spectator Mode</div>
                            <div className="text-xs text-muted-foreground mt-1">
                                Watch AI agents battle (you only handle bailouts)
                            </div>
                        </div>
                        <button
                            onClick={handleSpectatorToggle}
                            className={`
                                w-14 h-8 rounded-full transition-all duration-200 relative
                                ${spectatorMode ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-600'}
                            `}
                        >
                            <div className={`
                                absolute top-1 w-6 h-6 rounded-full bg-white transition-all duration-200 shadow-md
                                ${spectatorMode ? 'left-7' : 'left-1'}
                            `} />
                        </button>
                    </div>

                    {!spectatorMode && (
                        <div className="space-y-2">
                            <label className="text-sm font-bold uppercase tracking-wide text-muted-foreground">Your Name</label>
                            <Input 
                                value={playerName} 
                                onChange={(e) => setPlayerName(e.target.value)} 
                                className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-lg font-bold"
                                placeholder="Enter your name..."
                            />
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
                            Select {spectatorMode ? '4 AI Players' : '3 Opponents'}
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {AVAILABLE_MODELS.map((model) => {
                                const isSelected = selectedModels.includes(model.id);
                                return (
                                    <div 
                                        key={model.id}
                                        onClick={() => toggleModel(model.id)}
                                        className={`
                                            cursor-pointer flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-200
                                            ${isSelected 
                                                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 shadow-md scale-[1.02]' 
                                                : 'border-slate-200 dark:border-slate-800 hover:border-indigo-200 hover:bg-slate-50 dark:hover:bg-slate-900'
                                            }
                                        `}
                                    >
                                        <div>
                                            <div className="font-bold text-sm md:text-base">{model.name}</div>
                                            <div className="text-xs text-muted-foreground font-mono uppercase tracking-wide mt-1">
                                                {model.category}
                                            </div>
                                        </div>
                                        <div className={`
                                            w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors
                                            ${isSelected ? 'border-indigo-500 bg-indigo-500 text-white' : 'border-slate-300'}
                                        `}>
                                            {isSelected && <span className="text-xs font-bold">✓</span>}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="flex justify-between items-center bg-slate-50 dark:bg-slate-900/50 py-4 rounded-b-xl border-t">
                    <div className="text-sm font-medium text-muted-foreground">
                        {selectedModels.length} / {maxModels} Selected
                    </div>
                    <Button 
                        size="lg" 
                        onClick={() => onStart(selectedModels, playerName || "Human", apiKey, spectatorMode)} 
                        disabled={selectedModels.length !== maxModels || (!spectatorMode && !playerName.trim()) || !apiKey.trim()}
                        className="font-bold text-lg px-8 bg-indigo-600 hover:bg-indigo-700 shadow-lg hover:shadow-xl transition-all"
                    >
                        {spectatorMode ? '🎭 Watch AI Battle' : 'Start Game'}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
