#!/bin/bash

# GameTable Development Quickstart
# This script sets up and runs the entire application

set -e

echo "======================================"
echo "  GameTable - Development Setup"
echo "======================================"
echo ""

# Check prerequisites
command -v docker &> /dev/null && HAS_DOCKER=1 || HAS_DOCKER=0
command -v cargo &> /dev/null && HAS_RUST=1 || HAS_RUST=0
command -v npm &> /dev/null && HAS_NODE=1 || HAS_NODE=0

echo "Environment Check:"
echo "  Docker: $([ $HAS_DOCKER -eq 1 ] && echo '✓' || echo '✗')"
echo "  Rust:   $([ $HAS_RUST -eq 1 ] && echo '✓' || echo '✗')"
echo "  Node:   $([ $HAS_NODE -eq 1 ] && echo '✓' || echo '✗')"
echo ""

# Ask user preference
if [ $HAS_DOCKER -eq 1 ]; then
    echo "Options:"
    echo "  1) Run with Docker (recommended)"
    echo "  2) Run locally (requires Rust + Node)"
    read -p "Choose option (1 or 2): " CHOICE
else
    CHOICE=2
    echo "Docker not found, falling back to local setup..."
fi

echo ""

if [ "$CHOICE" == "1" ]; then
    echo "Starting GameTable with Docker..."
    docker-compose up --build
elif [ "$CHOICE" == "2" ]; then
    if [ $HAS_RUST -eq 0 ] || [ $HAS_NODE -eq 0 ]; then
        echo "Error: Rust and Node.js are required for local setup"
        echo "Install from: https://rustup.rs and https://nodejs.org"
        exit 1
    fi
    
    echo "Starting backend..."
    cd backend
    cargo build --release &
    BACKEND_PID=$!
    
    sleep 3
    
    echo "Starting frontend..."
    cd ../frontend
    npm install > /dev/null 2>&1
    npm start
else
    echo "Invalid option"
    exit 1
fi
