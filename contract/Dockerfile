FROM node:22.17.0-alpine

# Create app directory
WORKDIR /kunai-contract

# Copy source code
COPY . .

# Install pnpm globally
RUN npm install -g pnpm

# Install dependencies
RUN pnpm install

# Expose ports
EXPOSE 8545

# Start script
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

ENTRYPOINT ["docker-entrypoint.sh"]
