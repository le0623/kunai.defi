#!/bin/sh

# Function to start frontend development server
start_dev_server() {
    echo "Starting frontend development server..."
    pnpm dev --host 0.0.0.0
}

echo "Starting Kunai Frontend Development Environment..."

# Start frontend development server
start_dev_server
