export type PlayerId = string;

export type TileType = 
  | 'PROPERTY' 
  | 'RAILROAD' 
  | 'UTILITY' 
  | 'GO' 
  | 'JAIL' 
  | 'FREE_PARKING' 
  | 'GO_TO_JAIL' 
  | 'TAX' 
  | 'CHANCE' 
  | 'COMMUNITY_CHEST';

export interface Tile {
  id: number;
  name: string;
  type: TileType;
  price?: number;
  rent?: number[]; // [base, 1 house, 2 houses, ..., hotel]
  houseCost?: number;
  group?: string; // e.g., 'Brown', 'LightBlue', 'Railroad'
  ownerId?: PlayerId | null;
  houses?: number; // 5 = hotel
  isMortgaged?: boolean;
}

export interface Player {
  id: PlayerId;
  name: string;
  avatar?: string;
  color: string; // Hex color for UI
  money: number;
  position: number;
  isJailed: boolean;
  jailTurns: number;
  properties: number[]; // Array of Tile IDs
  isAI: boolean;
  messages: string[]; // Chat history for this player
}

export interface GameState {
  players: Player[];
  board: Tile[];
  currentPlayerIndex: number;
  dice: [number, number];
  isDoubles: boolean;
  doublesCount: number;
  gamePhase: 'ROLL' | 'ACTION' | 'END_TURN'; // ACTION includes buy/auction decision
  logs: string[]; // Game event logs
  chat: { sender: string; message: string; color: string }[];
  winner: PlayerId | null;
  lastDrawnCard?: { text: string; type: 'CHANCE' | 'COMMUNITY_CHEST' };
  lastRentPayment?: { payerId: string; payeeId: string; amount: number };
  lastJailFine?: { payerId: string; amount: number };
}
