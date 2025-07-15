.PHONY: help build up down logs clean restart frontend backend nginx all deploy ssl-cert ssl-renew status shell-frontend shell-backend shell-nginx test-api test-frontend backup restore

# Default target
help: ## Show this help message
	@echo 'KunAI Deployment Makefile'
	@echo '========================'
	@echo ''
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-20s %s\n", $$1, $$2}' $(MAKEFILE_LIST)
	@echo ''
	@echo 'Environment Variables:'
	@echo '  DOMAIN=kunai.trade'
	@echo '  API_DOMAIN=api.kunai.trade'
	@echo '  SERVER_IP=95.217.41.161'

# Build targets
build: ## Build all Docker images
	@echo "Building all Docker images..."
	docker compose build --no-cache
	@echo "✅ Build completed"

build-frontend: ## Build only frontend image
	@echo "Building frontend image..."
	docker compose build kunai-frontend
	@echo "✅ Frontend build completed"

build-backend: ## Build only backend image
	@echo "Building backend image..."
	docker compose build kunai-backend
	@echo "✅ Backend build completed"

# Deployment targets
deploy: build up ## Deploy complete application (build + start)
	@echo "🚀 KunAI deployed successfully!"
	@echo "Frontend: https://kunai.trade"
	@echo "API: https://api.kunai.trade"
	@echo "Health: https://api.kunai.trade/health"

up: ## Start all services
	@echo "Starting all services..."
	docker compose up -d
	@echo "✅ Services started"
	@echo "Waiting for services to be healthy..."
	@sleep 10
	@make status

down: ## Stop all services
	@echo "Stopping all services..."
	docker compose down
	@echo "✅ Services stopped"

restart: ## Restart all services
	@echo "Restarting all services..."
	docker compose restart
	@echo "✅ Services restarted"

# SSL Certificate management
ssl-cert: ## Generate SSL certificates using Let's Encrypt
	@echo "🔐 Setting up SSL certificates..."
	@if [ ! -f .ssl/cert.pem ] || [ ! -f .ssl/key.pem ]; then \
		echo "Installing certbot..."; \
		sudo apt update && sudo apt install -y certbot; \
		echo "Getting SSL certificates..."; \
		sudo certbot certonly --standalone -d kunai.trade -d api.kunai.trade --agree-tos --non-interactive; \
		echo "Copying certificates..."; \
		sudo cp /etc/letsencrypt/live/kunai.trade/fullchain.pem .ssl/cert.pem; \
		sudo cp /etc/letsencrypt/live/kunai.trade/privkey.pem .ssl/key.pem; \
		sudo chown $$USER:$$USER .ssl/cert.pem .ssl/key.pem; \
		echo "✅ SSL certificates generated"; \
	else \
		echo "✅ SSL certificates already exist"; \
	fi

ssl-renew: ## Renew SSL certificates
	@echo "🔄 Renewing SSL certificates..."
	sudo certbot renew --quiet
	@if [ $$? -eq 0 ]; then \
		echo "Copying renewed certificates..."; \
		sudo cp /etc/letsencrypt/live/kunai.trade/fullchain.pem .ssl/cert.pem; \
		sudo cp /etc/letsencrypt/live/kunai.trade/privkey.pem .ssl/key.pem; \
		sudo chown $$USER:$$USER .ssl/cert.pem .ssl/key.pem; \
		echo "Restarting nginx..."; \
		docker compose restart nginx; \
		echo "✅ SSL certificates renewed"; \
	else \
		echo "❌ SSL certificate renewal failed"; \
	fi

ssl-self-signed: ## Generate self-signed SSL certificates for development
	@echo "🔐 Generating self-signed SSL certificates..."
	mkdir -p .ssl
	openssl req -x509 -newkey rsa:4096 -keyout .ssl/key.pem -out .ssl/cert.pem -days 365 -nodes \
		-subj "/C=US/ST=State/L=City/O=KunAI/CN=kunai.trade" \
		-addext "subjectAltName=DNS:kunai.trade,DNS:www.kunai.trade,DNS:api.kunai.trade"
	chmod 600 .ssl/key.pem
	chmod 644 .ssl/cert.pem
	@echo "✅ Self-signed SSL certificates generated"

# Service management
frontend: ## Start only frontend
	@echo "Starting frontend..."
	docker compose up -d kunai-frontend
	@echo "✅ Frontend started"

backend: ## Start only backend
	@echo "Starting backend..."
	docker compose up -d kunai-backend
	@echo "✅ Backend started"

nginx: ## Start only nginx
	@echo "Starting nginx..."
	docker compose up -d nginx
	@echo "✅ Nginx started"

all: ## Start all services (frontend, backend, nginx, database, redis)
	@echo "Starting all services..."
	docker compose up -d
	@echo "✅ All services started"

# Monitoring and logs
status: ## Show status of all services
	@echo " Service Status:"
	@docker compose ps
	@echo ""
	@echo "🌐 Access URLs:"
	@echo "Frontend: https://kunai.trade"
	@echo "API: https://api.kunai.trade"
	@echo "Health: https://api.kunai.trade/health"

logs: ## Show logs for all services
	@echo "📋 Service Logs:"
	docker compose logs -f

logs-frontend: ## Show frontend logs
	@echo " Frontend Logs:"
	docker compose logs -f kunai-frontend

logs-backend: ## Show backend logs
	@echo "📋 Backend Logs:"
	docker compose logs -f kunai-backend

logs-nginx: ## Show nginx logs
	@echo "📋 Nginx Logs:"
	docker compose logs -f nginx

# Shell access
shell-frontend: ## Open shell in frontend container
	@echo "🐚 Opening frontend shell..."
	docker compose exec kunai-frontend sh

shell-backend: ## Open shell in backend container
	@echo "🐚 Opening backend shell..."
	docker compose exec kunai-backend sh

shell-nginx: ## Open shell in nginx container
	@echo "🐚 Opening nginx shell..."
	docker compose exec nginx sh

# Testing
test-api: ## Test API endpoints
	@echo "🧪 Testing API endpoints..."
	@echo "Testing health endpoint..."
	@curl -s -o /dev/null -w "Health: %{http_code}\n" https://api.kunai.trade/health || echo "Health: Failed"
	@echo "Testing frontend..."
	@curl -s -o /dev/null -w "Frontend: %{http_code}\n" https://kunai.trade || echo "Frontend: Failed"

test-frontend: ## Test frontend accessibility
	@echo "🧪 Testing frontend..."
	@curl -s -o /dev/null -w "Frontend: %{http_code}\n" https://kunai.trade

test-ssl: ## Test SSL certificate
	@echo "🔐 Testing SSL certificate..."
	@openssl s_client -connect kunai.trade:443 -servername kunai.trade < /dev/null 2>/dev/null | openssl x509 -noout -dates

# Database management
db-backup: ## Backup PostgreSQL database
	@echo "💾 Creating database backup..."
	@mkdir -p .backups
	@docker compose exec -T postgres pg_dump -U $$(grep POSTGRES_USER .env | cut -d '=' -f2) $$(grep POSTGRES_DB .env | cut -d '=' -f2) > .backups/kunai_backup_$$(date +%Y%m%d_%H%M%S).sql
	@echo "✅ Database backup created"

db-restore: ## Restore PostgreSQL database from backup
	@echo " Restoring database from backup..."
	@if [ -z "$(BACKUP_FILE)" ]; then \
		echo "Usage: make db-restore BACKUP_FILE=.backups/filename.sql"; \
		exit 1; \
	fi
	@docker compose exec -T postgres psql -U $$(grep POSTGRES_USER .env | cut -d '=' -f2) $$(grep POSTGRES_DB .env | cut -d '=' -f2) < $(BACKUP_FILE)
	@echo "✅ Database restored"

# Maintenance
clean: ## Remove all containers, networks, and volumes
	@echo " Cleaning up Docker resources..."
	docker compose down -v --remove-orphans
	docker system prune -f
	@echo "✅ Cleanup completed"

clean-images: ## Remove all Docker images
	@echo "🧹 Removing Docker images..."
	docker compose down
	docker rmi $$(docker images -q) 2>/dev/null || true
	@echo "✅ Images removed"

# Environment setup
setup-env: ## Setup environment files
	@echo "⚙️ Setting up environment files..."
	@if [ ! -f backend/.env ]; then \
		echo "Creating backend .env file..."; \
		cp backend/.example.env backend/.env; \
		echo "✅ Backend .env created"; \
	else \
		echo "✅ Backend .env already exists"; \
	fi
	@if [ ! -f frontend/.env ]; then \
		echo "Creating frontend .env file..."; \
		cp frontend/.example.env frontend/.env; \
		echo "✅ Frontend .env created"; \
	else \
		echo "✅ Frontend .env already exists"; \
	fi
	@echo "Please edit the .env files with your configuration"

# Production deployment
production-deploy: setup-env ssl-cert deploy ## Full production deployment
	@echo "🚀 Production deployment completed!"
	@echo "Frontend: https://kunai.trade"
	@echo "API: https://api.kunai.trade"
	@echo "Health: https://api.kunai.trade/health"

# Development deployment
dev-deploy: setup-env ssl-self-signed deploy ## Development deployment with self-signed certificates
	@echo "🚀 Development deployment completed!"
	@echo "Frontend: https://kunai.trade (self-signed)"
	@echo "API: https://api.kunai.trade (self-signed)"

# Auto-renewal setup
setup-auto-renewal: ## Setup automatic SSL certificate renewal
	@echo "🔄 Setting up automatic SSL certificate renewal..."
	@echo "0 12 * * * /usr/bin/certbot renew --quiet && make ssl-renew" | sudo crontab -
	@echo "✅ Auto-renewal configured (runs daily at 12:00)"

# Security check
security-check: ## Run security checks
	@echo "🔒 Running security checks..."
	@echo "Checking SSL certificate..."
	@make test-ssl
	@echo "Checking service status..."
	@make status
	@echo "Checking firewall..."
	@sudo ufw status | grep -E "(80|443)" || echo "Firewall ports 80/443 not configured"

# Quick commands
quick-restart: down up ## Quick restart (stop all, start all)
	@echo "⚡ Quick restart completed"

quick-rebuild: clean build deploy ## Quick rebuild (clean, build, deploy)
	@echo "⚡ Quick rebuild completed"

# Emergency commands
emergency-stop: ## Emergency stop all services
	@echo " Emergency stopping all services..."
	docker compose down --remove-orphans
	docker system prune -f
	@echo "✅ All services stopped"

emergency-restart: emergency-stop deploy ## Emergency restart (stop all, deploy fresh)
	@echo "🚨 Emergency restart completed"

# Information
info: ## Show deployment information
	@echo "📋 KunAI Deployment Information"
	@echo "================================"
	@echo "Domain: kunai.trade"
	@echo "API Domain: api.kunai.trade"
	@echo "Server IP: 95.217.41.161"
	@echo ""
	@echo "Services:"
	@echo "- Frontend (React/Vite): Port 5173"
	@echo "- Backend (Node.js): Port 5000"
	@echo "- Nginx (Reverse Proxy): Port 80/443"
	@echo "- PostgreSQL: Port 5432"
	@echo "- Redis: Port 6379"
	@echo ""
	@echo "SSL: Let's Encrypt certificates"
	@echo "Auto-renewal: Daily at 12:00"
	@echo ""
	@make status

# Default target
.DEFAULT_GOAL := help
