# Kunai Backend Development Makefile

.PHONY: help setup start stop restart logs clean reset build shell db-shell db-migrate db-seed db-studio test lint format

# Default target
help: ## Show this help message
	@echo "🚀 Kunai Backend Development Commands"
	@echo ""
	@echo "📋 Setup Commands:"
	@echo "  setup          - Initial setup (create .env, install dependencies)"
	@echo "  build          - Build Docker images"
	@echo ""
	@echo "🔄 Lifecycle Commands:"
	@echo "  start          - Start development environment"
	@echo "  stop           - Stop development environment"
	@echo "  restart        - Restart development environment"
	@echo "  logs           - View logs from all services"
	@echo "  logs-follow    - Follow logs from all services"
	@echo ""
	@echo "🧹 Cleanup Commands:"
	@echo "  clean          - Stop and remove containers"
	@echo "  reset          - Stop, remove containers and volumes (WARNING: deletes data)"
	@echo ""
	@echo "🔧 Development Commands:"
	@echo "  shell          - Access backend container shell"
	@echo "  db-shell       - Access PostgreSQL shell"
	@echo "  db-migrate     - Run database migrations"
	@echo "  db-seed        - Seed database with initial data"
	@echo "  db-studio      - Open Prisma Studio"
	@echo ""
	@echo "🧪 Testing Commands:"
	@echo "  test           - Run tests"
	@echo "  test-watch     - Run tests in watch mode"
	@echo ""
	@echo "📝 Code Quality:"
	@echo "  lint           - Run ESLint"
	@echo "  lint-fix       - Fix ESLint issues"
	@echo "  format         - Format code with Prettier"
	@echo ""

# Setup commands
setup: ## Initial setup
	@echo "🔧 Setting up Kunai Backend Development Environment..."
	@if [ ! -f .env ]; then \
		echo "📝 Creating .env file from template..."; \
		cp env.example.dev .env; \
		echo "⚠️  Please edit .env file with your configuration!"; \
		echo "   Key variables to set:"; \
		echo "   - JWT_SECRET"; \
		echo "   - TELEGRAM_BOT_TOKEN"; \
		echo "   - TELEGRAM_BOT_USERNAME"; \
		echo "   - RPC_URL"; \
		echo "   - OPERATOR_PRIVATE_KEY"; \
		echo "   - ETHERSCAN_API_KEY"; \
		echo "   - COINGECKO_API_KEY"; \
	else \
		echo "✅ .env file already exists"; \
	fi
	@chmod +x docker-entrypoint.sh
	@echo "✅ Setup complete!"

build: ## Build Docker images
	@echo "🔨 Building Docker images..."
	docker compose build

# Lifecycle commands
start: ## Start development environment
	@echo "🚀 Starting development environment..."
	docker compose up -d
	@echo "✅ Services started!"

stop: ## Stop development environment
	@echo "🛑 Stopping development environment..."
	docker compose down

restart: stop start ## Restart development environment

logs: ## View logs from all services
	docker compose logs

logs-follow: ## Follow logs from all services
	docker compose logs -f

# Cleanup commands
clean: ## Stop and remove containers
	@echo "🧹 Cleaning up containers..."
	docker compose down

reset: ## Stop, remove containers and volumes (WARNING: deletes data)
	@echo "⚠️  WARNING: This will delete all data!"
	@echo -n "Are you sure? [y/N] "
	@read REPLY; \
	if [ "$$REPLY" = "y" ] || [ "$$REPLY" = "Y" ]; then \
		echo ""; \
		echo "🗑️  Resetting everything..."; \
		docker compose down -v; \
		docker system prune -f; \
		echo "✅ Reset complete!"; \
	else \
		echo ""; \
		echo "❌ Reset cancelled"; \
	fi

# Development commands
shell: ## Access backend container shell
	@echo "🐚 Accessing backend container shell..."
	docker exec -it kunai-backend sh

db-shell: ## Access PostgreSQL shell
	@echo "🗄️  Accessing PostgreSQL shell..."
	docker exec -it kunai-postgres psql -U postgres -d kunai

db-migrate: ## Run database migrations
	@echo "🔄 Running database migrations..."
	docker exec -it kunai-backend pnpm db:push

db-seed: ## Seed database with initial data
	@echo "🌱 Seeding database..."
	docker exec -it kunai-backend pnpm db:seed

db-studio: ## Open Prisma Studio
	@echo "📊 Opening Prisma Studio..."
	docker exec -it kunai-backend pnpm db:studio

# Testing commands
test: ## Run tests
	@echo "🧪 Running tests..."
	docker exec -it kunai-backend pnpm test

test-watch: ## Run tests in watch mode
	@echo "🧪 Running tests in watch mode..."
	docker exec -it kunai-backend pnpm test:watch

# Code quality commands
lint: ## Run ESLint
	@echo "🔍 Running ESLint..."
	docker exec -it kunai-backend pnpm lint

lint-fix: ## Fix ESLint issues
	@echo "🔧 Fixing ESLint issues..."
	docker exec -it kunai-backend pnpm lint:fix

format: ## Format code with Prettier
	@echo "✨ Formatting code..."
	docker exec -it kunai-backend pnpm format

# Utility commands
status: ## Show status of all services
	@echo "📊 Service Status:"
	@docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep kunai || echo "No Kunai services running"

logs-backend: ## View backend logs only
	@echo "📝 Backend logs:"
	docker logs kunai-backend

logs-postgres: ## View PostgreSQL logs only
	@echo "📝 PostgreSQL logs:"
	docker logs kunai-postgres

logs-redis: ## View Redis logs only
	@echo "📝 Redis logs:"
	docker logs kunai-redis

# Health check
health: ## Check health of all services
	@echo "🏥 Health Check:"
	@echo "Backend API:" && curl -s http://localhost:5000/health || echo "❌ Backend not responding"
	@echo "Hardhat Node:" && curl -s http://localhost:8545 || echo "❌ Hardhat not responding"
	@echo "PostgreSQL:" && docker exec kunai-postgres pg_isready -U postgres || echo "❌ PostgreSQL not ready"
	@echo "Redis:" && docker exec kunai-redis redis-cli ping || echo "❌ Redis not responding"

# Development workflow
dev: setup build start ## Complete development setup (setup + build + start)

# Production-like commands
prod-build: ## Build production image
	@echo "🏭 Building production image..."
	docker build -t kunai-backend:prod .

prod-run: ## Run production container
	@echo "🚀 Running production container..."
	docker run -d --name kunai-backend-prod -p 5000:5000 kunai-backend:prod

prod-stop: ## Stop production container
	@echo "🛑 Stopping production container..."
	docker stop kunai-backend-prod || true
	docker rm kunai-backend-prod || true
