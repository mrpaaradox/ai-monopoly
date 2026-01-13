#!/bin/bash

# Monopoly AI Setup Script
# This script will set up the project and get you ready to play!

set -e  # Exit on any error

echo "🎲 Welcome to Monopoly AI Setup!"
echo "================================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed!"
    echo "Please install Node.js (v18 or higher) from https://nodejs.org/"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18 or higher is required!"
    echo "Current version: $(node -v)"
    echo "Please upgrade Node.js from https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"
echo ""

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed!"
    echo "Please install npm"
    exit 1
fi

echo "✅ npm $(npm -v) detected"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
echo "This may take a few minutes..."
echo ""

if npm install; then
    echo "✅ Dependencies installed successfully!"
    echo ""
else
    echo "❌ Failed to install dependencies"
    exit 1
fi

# Set up environment variables
echo "🔑 Setting up environment variables..."
echo ""

if [ -f ".env.local" ]; then
    echo "⚠️  .env.local file already exists!"
    read -p "Do you want to overwrite it? (y/N): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Keeping existing .env.local file"
        SKIP_ENV=true
    fi
fi

if [ "$SKIP_ENV" != true ]; then
    echo ""
    echo "You need a Groq API key to run this project."
    echo "Get one for free at: https://console.groq.com"
    echo ""
    read -p "Enter your Groq API key: " GROQ_KEY
    
    if [ -z "$GROQ_KEY" ]; then
        echo "❌ No API key provided!"
        echo "You can manually create a .env.local file and add:"
        echo "GROQ_API_KEY=your_api_key_here"
        exit 1
    fi
    
    echo "GROQ_API_KEY=$GROQ_KEY" > .env.local
    echo "✅ Environment variables configured!"
    echo ""
fi

# Success message
echo "🎉 Setup complete!"
echo ""
echo "🚀 Starting the development server..."
echo "The game will be available at: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop the server when you're done playing."
echo ""
echo "Enjoy the game! 🎩"
echo ""

# Start the development server
npm run dev
