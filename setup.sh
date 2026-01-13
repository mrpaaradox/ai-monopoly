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

# Success message
echo "🎉 Setup complete!"
echo ""
echo "🚀 To start playing:"
echo "  1. Run: npm run dev"
echo "  2. Open: http://localhost:3000"
echo "  3. Enter your Groq API key in the setup dialog"
echo "     (Get one free at: https://console.groq.com)"
echo ""
echo "Enjoy the game! 🎩"
echo ""
