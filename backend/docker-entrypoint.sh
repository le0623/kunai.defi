#!/bin/sh

# Function to run database migrations
run_migrations() {
    echo "Running database migrations..."
    pnpm db:push
    echo "Database migrations completed!"
}

# Function to start development server
start_dev_server() {
    echo "Starting development server..."
    pnpm dev
}

echo "Starting Kunai Backend Development Environment..."

# Run migrations
run_migrations

# Start development server
start_dev_server
