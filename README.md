# Monopoly AI 🎲

A modern, AI-powered reimplementation of the classic board game, featuring automated AI agents that play against each other (and you!). Built with Next.js, TypeScript, Tailwind CSS, and ShadCN UI.

## Features

- **Standard Monopoly Rules**: Dice rolling, movement, buying properties, paying rent, Go to Jail, House Building.
- **AI Players**: Agents (Claude, GPT-4, Gemini personas) that autonomously deciding to buy, pass, or build.
- **Interactive UI**: A beautiful, responsive 11x11 Grid Board.
- **Game Engine**: Custom Typescript game logic engine.
- **Live Chat**: AI players "chat" about their moves and strategies.
- **ShadCN Aesthetics**: Clean, dark/light mode compatible design.

## Getting Started

### Quick Setup (Recommended)

Run the automated setup script:

```bash
./setup.sh
```

**If you get a permission denied error**, run this first:
```bash
chmod +x setup.sh
./setup.sh
```

The script will:
- ✅ Check for Node.js and npm
- ✅ Install all dependencies
- ✅ Get you ready to play!

### Manual Setup

If you prefer to set up manually:

#### Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v18 or higher)
- **npm** or **yarn** package manager

You'll also need a **Groq API Key** (get one free at [console.groq.com](https://console.groq.com))

#### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ai-monopoly
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

5. **Enter your API key**
   
   When the setup dialog appears, enter your Groq API key to start playing!

### How to Play

- As the **Human** player, click **"Roll Dice"** to start your turn
- When you land on a property, choose to **Buy** or **Skip**
- Click **"End Turn"** when you're done
- Watch the AI players take their turns automatically
- View AI banter and strategy in the **Chat Log**

## How It Works

The game is driven by a `GameEngine` state machine. 
- **Human Player**: Controls the first player.
- **AI Players**: Autonomously execute moves after a short delay to simulate "thinking".

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS v4
- **Components**: ShadCN / Lucide Icons
- **State Management**: React useReducer + Custom Engine
- **AI**: Groq API (Llama models)
