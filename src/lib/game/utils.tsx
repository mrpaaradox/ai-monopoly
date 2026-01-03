
import React from 'react';
import { User, Bot, Zap, Globe, Cpu } from 'lucide-react';

export const getPlayerIcon = (index: number) => {
    switch(index) {
        case 0: return <User className="w-5 h-5 text-white" />;
        case 1: return <Bot className="w-5 h-5 text-white" />;
        case 2: return <Cpu className="w-5 h-5 text-white" />;
        case 3: return <Globe className="w-5 h-5 text-white" />;
        default: return <Zap className="w-5 h-5 text-white" />;
    }
};
