import { GameState, Player, Tile } from './types';
import { BOARD_DATA, INITIAL_MONEY } from './data';

// --- Utilities ---
const rollDie = () => Math.floor(Math.random() * 6) + 1;

export const createInitialState = (playerNames: string[]): GameState => {
  // Overridden if names not passed, but we default to specific Groq 2026 names here if names are passed as default.
  // Actually the caller passes them. Let's change the default in the caller or here.
  // We'll trust the caller to pass interesting names, but we can default simulated ones.
  const players: Player[] = playerNames.map((name, index) => ({
    id: `p${index}`,
    name,
    color: ['#EF4444', '#3B82F6', '#10B981', '#F59E0B'][index % 4], // Red, Blue, Green, Yellow
    money: INITIAL_MONEY,
    position: 0,
    isJailed: false,
    jailTurns: 0,
    properties: [],
    isAI: index > 0, // First player is Human, others AI for now
    messages: [],
  }));

  return {
    players,
    board: JSON.parse(JSON.stringify(BOARD_DATA)), // Deep copy to avoid mutations on base data if we modify it
    currentPlayerIndex: 0,
    dice: [1, 1],
    isDoubles: false,
    doublesCount: 0,
    gamePhase: 'ROLL',
    logs: ['Game started!'],
    chat: [],
    winner: null,
    lastDrawnCard: undefined,
    lastRentPayment: undefined,
    lastJailFine: undefined,
  };
};

export const rollDice = (state: GameState): GameState => {
  if (state.gamePhase !== 'ROLL') return state;

  const d1 = rollDie();
  const d2 = rollDie();
  const isDoubles = d1 === d2;
  const doublesCount = isDoubles ? state.doublesCount + 1 : 0;
  
  const newState = { ...state, dice: [d1, d2] as [number, number], isDoubles, doublesCount, lastDrawnCard: undefined, lastRentPayment: undefined, lastJailFine: undefined };
  
  const currentPlayer = newState.players[newState.currentPlayerIndex];
  
  newState.logs = [...newState.logs, `${currentPlayer.name} rolled ${d1} + ${d2} = ${d1 + d2}.`];

  // Handle Jail release
  if (currentPlayer.isJailed) {
    if (isDoubles) {
      newState.logs.push(`${currentPlayer.name} rolled doubles and escaped Jail!`);
      const releasedPlayer = { ...currentPlayer, isJailed: false, jailTurns: 0 };
      newState.players = newState.players.map(p => p.id === releasedPlayer.id ? releasedPlayer : p);
      return movePlayer(newState, d1 + d2);
    } else {
      const jailedPlayer = { ...currentPlayer, jailTurns: currentPlayer.jailTurns + 1 };
      if (jailedPlayer.jailTurns >= 3) {
         newState.logs.push(`${currentPlayer.name} paid $50 to escape Jail.`);
         jailedPlayer.money -= 50;
         jailedPlayer.isJailed = false;
         jailedPlayer.jailTurns = 0;
         newState.players = newState.players.map(p => p.id === jailedPlayer.id ? jailedPlayer : p);
         return movePlayer(newState, d1 + d2);
      }
      newState.players = newState.players.map(p => p.id === jailedPlayer.id ? jailedPlayer : p);
      return { ...newState, gamePhase: 'END_TURN' };
    }
  }

  if (doublesCount >= 3) {
    newState.logs.push(`${currentPlayer.name} rolled doubles 3 times and goes to Jail!`);
    const jailedPlayer = { ...currentPlayer, position: 10, isJailed: true, jailTurns: 0 };
    newState.players = newState.players.map(p => p.id === jailedPlayer.id ? jailedPlayer : p);
    return { ...newState, gamePhase: 'END_TURN', doublesCount: 0 };
  }

  return movePlayer(newState, d1 + d2);
};

const movePlayer = (state: GameState, steps: number): GameState => {
  const player = state.players[state.currentPlayerIndex];
  let newPosition = player.position + steps;
  let passedGo = false;

  if (newPosition >= 40) {
    newPosition -= 40;
    passedGo = true;
  }

  const finalMoney = player.money + (passedGo ? 200 : 0);
  if (passedGo) {
     state.logs.push(`${player.name} passed GO and collected $200.`);
     if (player.isAI) {
         const msgs = ["Nice, payday!", "Money money money!", "I needed that.", "Cash flow positive."];
         state.chat.push({ sender: player.name, message: msgs[Math.floor(Math.random() * msgs.length)], color: player.color });
     }
  }

  const updatedPlayer = { ...player, position: newPosition, money: finalMoney };
  const updatedPlayers = state.players.map(p => p.id === player.id ? updatedPlayer : p);
  
  const newState = { ...state, players: updatedPlayers };
  return handleTileLanding(newState, updatedPlayer);
};

// --- Card Definitions ---
export type CardEffect = 'MOVE' | 'MONEY' | 'MONEY_ALL' | 'GET_OUT_OF_JAIL' | 'GO_TO_JAIL' | 'REPAIRS' | 'MOVE_NEAREST';

export interface Card {
    text: string;
    effect: CardEffect;
    amount?: number; 
    target?: string;
}

export const CHANCE_CARDS: Card[] = [
    { text: "Advance to GO (Collect $200)", effect: 'MOVE', amount: 0 },
    { text: "Advance to United States", effect: 'MOVE', amount: 39 },
    { text: "Advance to nearest Utility", effect: 'MOVE_NEAREST', target: 'UTILITY' },
    { text: "Advance to nearest Metro", effect: 'MOVE_NEAREST', target: 'RAILROAD' },
    { text: "Bank pays you dividend of $50", effect: 'MONEY', amount: 50 },
    { text: "Get Out of Jail Free", effect: 'GET_OUT_OF_JAIL' },
    { text: "Go Back 3 Spaces", effect: 'MOVE', amount: -3 }, // Logic needs to handle relative vs absolute. We'll handle negative as relative.
    { text: "Go to Jail", effect: 'GO_TO_JAIL' },
    { text: "Make general repairs on all your property", effect: 'REPAIRS', amount: 25 },
    { text: "Pay poor tax of $15", effect: 'MONEY', amount: -15 },
    { text: "Take a trip to Shinkansen", effect: 'MOVE', amount: 15 },
    { text: "You have been elected Chairman of the Board", effect: 'MONEY', amount: -50 },
    { text: "Your building loan matures", effect: 'MONEY', amount: 150 },
];

export const CHEST_CARDS: Card[] = [
    { text: "Advance to GO (Collect $200)", effect: 'MOVE', amount: 0 },
    { text: "Bank error in your favor", effect: 'MONEY', amount: 200 },
    { text: "Doctor's fees", effect: 'MONEY', amount: -50 },
    { text: "From sale of stock you get $50", effect: 'MONEY', amount: 50 },
    { text: "Get Out of Jail Free", effect: 'GET_OUT_OF_JAIL' },
    { text: "Go to Jail", effect: 'GO_TO_JAIL' },
    { text: "Grand Opera Night", effect: 'MONEY', amount: 50 },
    { text: "Holiday Fund matures", effect: 'MONEY', amount: 100 },
    { text: "Income tax refund", effect: 'MONEY', amount: 20 },
    { text: "It is your birthday", effect: 'MONEY', amount: 10 },
    { text: "Life insurance matures", effect: 'MONEY', amount: 100 },
    { text: "Pay hospital fees of $100", effect: 'MONEY', amount: -100 },
    { text: "Pay school fees of $150", effect: 'MONEY', amount: -150 },
    { text: "Receive $25 consultancy fee", effect: 'MONEY', amount: 25 },
    { text: "You are assessed for street repairs", effect: 'REPAIRS', amount: 40 },
    { text: "You have won second prize in a beauty contest", effect: 'MONEY', amount: 10 },
    { text: "You inherit $100", effect: 'MONEY', amount: 100 },
];

const handleTileLanding = (state: GameState, player: Player): GameState => {
  const tile = state.board[player.position];
  let newState = { ...state };
  
  newState.logs.push(`${player.name} landed on ${tile.name}.`);

  if (tile.type === 'GO_TO_JAIL') {
    return sendToJail(newState, player);
  }

  if (tile.type === 'TAX') {
    const taxedPlayer = { ...player, money: player.money - (tile.price || 0) };
    newState.players = newState.players.map(p => p.id === player.id ? taxedPlayer : p);
    newState.logs.push(`${player.name} paid $${tile.price} tax.`);
    newState.gamePhase = state.isDoubles ? 'ROLL' : 'END_TURN';
  }
  
  // Chance / Community Chest
  else if (tile.type === 'CHANCE' || tile.type === 'COMMUNITY_CHEST') {
      const deck = tile.type === 'CHANCE' ? CHANCE_CARDS : CHEST_CARDS;
      const card = deck[Math.floor(Math.random() * deck.length)];
      
      newState.logs.push(`${player.name} drew: ${card.text}`);
      // Set the card in state for UI to display
      newState.lastDrawnCard = { text: card.text, type: tile.type as 'CHANCE' | 'COMMUNITY_CHEST' };
      
      if (player.isAI) {
           newState.chat.push({ sender: player.name, message: `I drew: ${card.text}`, color: player.color });
      }

      // Apply Effect
      switch(card.effect) {
          case 'MONEY':
              const newMoney = player.money + (card.amount || 0);
              const moneyPlayer = { ...player, money: newMoney };
              newState.players = newState.players.map(p => p.id === player.id ? moneyPlayer : p);
              newState.gamePhase = state.isDoubles ? 'ROLL' : 'END_TURN';
              break;
          case 'GO_TO_JAIL':
              return sendToJail(newState, player);
          case 'GET_OUT_OF_JAIL':
              // Simplified: Just give them a flag or log it. We don't have inventory for cards yet.
              // We'll give them $50 as compensation for now or just log.
              newState.logs.push(`${player.name} keeps the card (Simulated).`);
              newState.gamePhase = state.isDoubles ? 'ROLL' : 'END_TURN';
              break;
          case 'REPAIRS':
              // Calculate cost
              const repairCost = player.properties.reduce((acc, pid) => {
                  const t = state.board[pid];
                  return acc + (t.houses || 0) * (card.amount || 0);
              }, 0);
              const repairedPlayer = { ...player, money: player.money - repairCost };
              newState.players = newState.players.map(p => p.id === player.id ? repairedPlayer : p);
              newState.logs.push(`${player.name} paid $${repairCost} for repairs.`);
              newState.gamePhase = state.isDoubles ? 'ROLL' : 'END_TURN';
              break;
          case 'MOVE':
              if (card.amount === undefined) return newState;
              if (card.amount < 0) {
                  // Back steps
                  return movePlayer(newState, card.amount); // negative steps
              } else {
                  // Absolute index
                  // Calculate steps to get there to reuse movePlayer (handles GO)
                  let steps = card.amount - player.position;
                  if (steps < 0) steps += 40; // wrap around
                  return movePlayer(newState, steps);
              }
          case 'MOVE_NEAREST':
              // Find nearest forward
              let nearestIdx = -1;
              for (let i = 1; i < 40; i++) {
                  const checkIdx = (player.position + i) % 40;
                  if (state.board[checkIdx].type === card.target) {
                      nearestIdx = checkIdx;
                      break;
                  }
              }
              if (nearestIdx !== -1) {
                  let steps = nearestIdx - player.position;
                  if (steps < 0) steps += 40;
                  return movePlayer(newState, steps);
              }
              newState.gamePhase = state.isDoubles ? 'ROLL' : 'END_TURN';
              break;
      }
  }

  // Logic for properties
  else if (['PROPERTY', 'RAILROAD', 'UTILITY'].includes(tile.type)) {
     if (tile.ownerId === null || tile.ownerId === undefined) {
         newState.gamePhase = 'ACTION';
     } else if (tile.ownerId !== player.id) {
         newState = payRent(newState, player, tile);
         newState.gamePhase = state.isDoubles ? 'ROLL' : 'END_TURN';
     } else {
         newState.gamePhase = state.isDoubles ? 'ROLL' : 'END_TURN';
     }
  } else {
      newState.gamePhase = state.isDoubles ? 'ROLL' : 'END_TURN';
  }

  return newState;
}

const sendToJail = (state: GameState, player: Player): GameState => {
    const newState = { ...state };
    const jailedPlayer = { ...player, position: 10, isJailed: true, jailTurns: 0 };
    newState.players = newState.players.map(p => p.id === player.id ? jailedPlayer : p);
    newState.logs.push(`${player.name} goes to Jail!`);
    if (player.isAI) {
         newState.chat.push({ sender: player.name, message: "I've been framed!", color: player.color });
    }
    newState.gamePhase = 'END_TURN';
    return newState;
}

const payRent = (state: GameState, player: Player, tile: Tile): GameState => {
    if (!tile.ownerId) return state;
    
    // Calculate rent
    let rent = 0;
    if (tile.type === 'PROPERTY') {
        const houses = tile.houses || 0;
        rent = tile.rent ? tile.rent[houses] : 0;
        // Check for monopoly doubling (not implemented yet for simplicity)
    } else if (tile.type === 'RAILROAD') {
        // Find how many railroads owner has
        const owner = state.players.find(p => p.id === tile.ownerId);
        const rrCount = owner?.properties.filter(pid => {
            const t = state.board[pid];
            return t.type === 'RAILROAD';
        }).length || 0;
        rent = 25 * Math.pow(2, rrCount - 1);
    } else if (tile.type === 'UTILITY') {
        // simplified
        rent = (state.dice[0] + state.dice[1]) * 4; 
    }

    state.logs.push(`${player.name} pays $${rent} rent to owner.`);
    
    // Transfer money
    const owner = state.players.find(p => p.id === tile.ownerId)!;
    const newPlayerMoney = player.money - rent;
    const newOwnerMoney = owner.money + rent;
    
    // If player goes bankrupt (negative money), logic needed. For now just allow negative.
    
    // AI Chat Reaction
    if (player.isAI && rent > 50) {
        const msgs = [`Ouch! $${rent}?`, `There goes my savings to ${owner.name}.`, "Rent is too high!", "Just take my money."];
        state.chat.push({ sender: player.name, message: msgs[Math.floor(Math.random() * msgs.length)], color: player.color });
    }
    if (owner.isAI && rent > 50) {
        const msgs = ["Thanks for the rent!", "Business is booming.", "Investments paying off.", "Enjoy your stay!"];
        state.chat.push({ sender: owner.name, message: msgs[Math.floor(Math.random() * msgs.length)], color: owner.color });
    }

    const updatedPlayers = state.players.map(p => {
        if (p.id === player.id) return { ...p, money: newPlayerMoney };
        if (p.id === owner.id) return { ...p, money: newOwnerMoney };
        return p;
    });

    return { 
        ...state, 
        players: updatedPlayers,
        lastRentPayment: { payerId: player.id, payeeId: owner.id, amount: rent }
    };
}

export const buyProperty = (state: GameState): GameState => {
    if (state.gamePhase !== 'ACTION') return state;
    
    const player = state.players[state.currentPlayerIndex];
    const tile = state.board[player.position];
    
    if (tile.ownerId || !tile.price) return state; // Already owned or not buyable
    if (player.money < tile.price) {
        state.logs.push(`${player.name} cannot afford ${tile.name}.`);
        return { ...state, gamePhase: state.isDoubles ? 'ROLL' : 'END_TURN' };
    }

    const newMoney = player.money - tile.price;
    const updatedPlayer = { ...player, money: newMoney, properties: [...player.properties, tile.id] };
    const updatedTile = { ...tile, ownerId: player.id };
    
    const updatedPlayers = state.players.map(p => p.id === player.id ? updatedPlayer : p);
    const updatedBoard = state.board.map(t => t.id === tile.id ? updatedTile : t);
    
    state.logs.push(`${player.name} bought ${tile.name} for $${tile.price}.`);
    
    return { 
        ...state, 
        players: updatedPlayers, 
        board: updatedBoard, 
        gamePhase: state.isDoubles ? 'ROLL' : 'END_TURN' 
    };
};

export const buildHouse = (state: GameState, propertyId: number): GameState => {
    // Only allowed in ACTION or END_TURN? Usually any time on your turn.
    // We'll restrict to ACTION/END_TURN for simplicity.
    if (state.gamePhase === 'ROLL') return state;

    const player = state.players[state.currentPlayerIndex];
    const tile = state.board[propertyId];

    if (tile.ownerId !== player.id || !tile.houseCost || tile.type !== 'PROPERTY') return state;

    // Check Monopoly
    const group = tile.group;
    const groupProperties = state.board.filter(t => t.group === group);
    const ownsAll = groupProperties.every(t => t.ownerId === player.id);
    
    if (!ownsAll) {
        state.logs.push(`${player.name} needs the full color set to build.`);
        return { ...state }; // Return new object if mapped, but here we mute inputs if not careful. 
        // Ideally return state as is but with log update.
    }

    // Check house limit (5 = Hotel)
    if ((tile.houses || 0) >= 5) return state;

    // Check even building rule (simplified: ignore just allow building)

    if (player.money < tile.houseCost) return state;

    const newMoney = player.money - tile.houseCost;
    const newHouses = (tile.houses || 0) + 1;
    
    const updatedPlayer = { ...player, money: newMoney };
    const updatedTile = { ...tile, houses: newHouses };
    
    const updatedPlayers = state.players.map(p => p.id === player.id ? updatedPlayer : p);
    const updatedBoard = state.board.map(t => t.id === tile.id ? updatedTile : t);
    
    const houseName = newHouses === 5 ? 'Hotel' : 'House';
    state.logs.push(`${player.name} built a ${houseName} on ${tile.name}.`);

    return { ...state, players: updatedPlayers, board: updatedBoard };
};

export const skipBuy = (state: GameState): GameState => {
     if (state.gamePhase !== 'ACTION') return state;
     state.logs.push(`${state.players[state.currentPlayerIndex].name} decided not to buy.`);
     return { ...state, gamePhase: state.isDoubles ? 'ROLL' : 'END_TURN' };
}

export const nextTurn = (state: GameState): GameState => {
    if (state.gamePhase !== 'END_TURN') return state;
    
    const nextIndex = (state.currentPlayerIndex + 1) % state.players.length;
    return {
        ...state,
        currentPlayerIndex: nextIndex,
        isDoubles: false,
        doublesCount: 0,
        gamePhase: 'ROLL',
        lastDrawnCard: undefined,
        lastRentPayment: undefined,
        lastJailFine: undefined
    };
};

export const payJailFine = (state: GameState): GameState => {
    if (state.gamePhase !== 'ROLL') return state;
    
    const player = state.players[state.currentPlayerIndex];
    if (!player.isJailed) return state;

    if (player.money < 50) {
        state.logs.push(`${player.name} cannot afford the $50 jail fine.`);
        return state;
    }

    const newMoney = player.money - 50;
    const updatedPlayer = { ...player, money: newMoney, isJailed: false, jailTurns: 0 };
    const updatedPlayers = state.players.map(p => p.id === player.id ? updatedPlayer : p);
    
    state.logs.push(`${player.name} paid $50 fine to get out of Jail.`);

    return { ...state, players: updatedPlayers, lastJailFine: { payerId: player.id, amount: 50 }, lastDrawnCard: undefined, lastRentPayment: undefined };
};
