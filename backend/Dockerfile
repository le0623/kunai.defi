FROM node:22.17.0-alpine

# Create app directory
WORKDIR /app

# Copy workspace configuration files
COPY package.json pnpm-workspace.yaml ./

# Copy shared package
COPY shared ./shared

# Copy backend files
COPY backend ./backend

# Install pnpm globally
RUN npm install -g pnpm

# Install dependencies (pnpm will resolve workspace dependencies)
RUN pnpm install

# Set working directory to backend
WORKDIR /app/backend

# Expose ports
EXPOSE 5000

# Start script
COPY backend/docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

ENTRYPOINT ["docker-entrypoint.sh"]
