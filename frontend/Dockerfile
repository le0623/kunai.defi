# Build stage
FROM node:22.17.0-alpine

# Create app directory
WORKDIR /app

# Copy workspace configuration files
COPY package.json pnpm-workspace.yaml ./

# Copy shared package
COPY shared ./shared

# Copy frontend files
COPY frontend ./frontend

# Install pnpm globally
RUN npm install -g pnpm

# Install dependencies (pnpm will resolve workspace dependencies)
RUN pnpm install

# Set working directory to frontend
WORKDIR /app/frontend

# Expose ports
EXPOSE 5173

# Start script
COPY frontend/docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

ENTRYPOINT ["docker-entrypoint.sh"]
