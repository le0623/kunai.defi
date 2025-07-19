#!/bin/sh

# Function to start frontend development server
start_dev_server() {
    echo "Starting frontend development server..."
    cd /app && pnpm --filter kunai-frontend dev --host 0.0.0.0 --port 5173
}

echo "Starting Kunai Frontend Development Environment..."

# Start frontend development server
start_dev_server
