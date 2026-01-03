/**
 * LLM Council Configuration
 * 
 * This file contains the configuration for the debate models and their personas.
 * You can customize this to create different debate scenarios.
 */

export const DEBATE_TOPIC = {
  title: "India vs China: Future Global Dominance",
  description: "Which nation will emerge as the more dominant global power in the next 40 years?",
  context: [
    "Economic growth and technological innovation",
    "Demographics and social structures", 
    "Historical patterns and geopolitical strategies",
    "Global trade and market dynamics"
  ],
};

export const MODELS = [
  'llama-3.3-70b-versatile',
  'llama-3.1-70b-versatile',
  'mixtral-8x7b-32768',
  'gemma2-9b-it',
] as const;

export const MODEL_PERSONAS = {
  'llama-3.3-70b-versatile': {
    name: 'The Geopolitical Analyst',
    icon: '🌐',
    color: 'from-blue-500 to-cyan-500',
    bias: 'Focuses on economic indicators and technological advancement',
    expertise: ['Technology', 'Economics', 'Innovation'],
  },
  'llama-3.1-70b-versatile': {
    name: 'The Historical Scholar',
    icon: '📚',
    color: 'from-purple-500 to-pink-500',
    bias: 'Analyzes through the lens of historical patterns and civilizational cycles',
    expertise: ['History', 'Culture', 'Long-term Trends'],
  },
  'mixtral-8x7b-32768': {
    name: 'The Demographics Expert',
    icon: '👥',
    color: 'from-orange-500 to-red-500',
    bias: 'Emphasizes population dynamics and social structures',
    expertise: ['Demographics', 'Society', 'Population'],
  },
  'gemma2-9b-it': {
    name: 'The Economic Strategist',
    icon: '💼',
    color: 'from-green-500 to-emerald-500',
    bias: 'Prioritizes market forces and global trade patterns',
    expertise: ['Markets', 'Trade', 'Finance'],
  },
} as const;

export const DEBATE_CONFIG = {
  maxTokensPerResponse: 500,
  temperature: 0.8,
  streamingDelay: 50, // ms between tokens for visual effect
  roundPrompts: {
    0: "In the next 40 years, will India or China emerge as the more dominant global power? Present your opening argument with specific factors supporting your position.",
    1: "Based on the previous arguments, provide a rebuttal and strengthen your position. Address the key points raised by other council members.",
    2: "Consider the counterarguments presented. What are the potential weaknesses in your position, and how do you address them?",
    3: "Looking at the complete picture, what is your final assessment? Provide a nuanced conclusion that acknowledges multiple perspectives.",
  },
};

export type ModelId = typeof MODELS[number];
export type ModelPersona = typeof MODEL_PERSONAS[ModelId];
