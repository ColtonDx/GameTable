#!/bin/bash
set -e

echo "Building GameTable application..."

# Build backend
echo "Building Rust backend..."
cd backend
cargo build --release
cd ..

# Build frontend
echo "Building React frontend..."
cd frontend
npm install
npm run build
cd ..

echo "Build complete! You can now run with: docker-compose up --build"
