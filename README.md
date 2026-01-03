# Monopoly AI 🎲

A modern, AI-powered reimplementation of the classic board game, featuring automated AI agents that play against each other (and you!). Built with Next.js, TypeScript, Tailwind CSS, and ShadCN UI.

## Features

- **Standard Monopoly Rules**: Dice rolling, movement, buying properties, paying rent, Go to Jail, House Building.
- **AI Players**: Agents (Claude, GPT-4, Gemini personas) that autonomously deciding to buy, pass, or build.
- **Interactive UI**: A beautiful, responsive 11x11 Grid Board.
- **Game Engine**: Custom Typescript game logic engine.
- **Live Chat**: AI players "chat" about their moves and strategies.
- **ShadCN Aesthetics**: Clean, dark/light mode compatible design.

## How It Works

The game is driven by a `GameEngine` state machine. 
- **Human Player**: Controls the first player.
- **AI Players**: Automonously execute moves after a short delay to simulate "thinking".

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS v4
- **Components**: ShadCN / Lucide Icons
- **State Management**: React useReducer + Custom Engine
