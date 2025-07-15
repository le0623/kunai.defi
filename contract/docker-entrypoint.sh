#!/bin/sh

# Function to run Hardhat node
run_hardhat_node() {
    echo "Starting Hardhat node..."
    pnpm node --hostname 0.0.0.0
    echo "Hardhat node started!"
}

# Function to run compile contracts
run_compile() {
    echo "Compiling contracts..."
    pnpm compile
    echo "Contracts compiled!"
}

# Function to deploy contracts
run_deploy() {
    echo "Deploying contracts..."
    pnpm deploy:hardhat
    echo "Contracts deployed!"
}

echo "Starting Kunai Contract Development Environment..."

# Run Hardhat node
run_hardhat_node

# Compile contracts
run_compile

# Deploy contracts
run_deploy
