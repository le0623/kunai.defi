#!/bin/bash

# HTTPS Deployment Script for Kunai Backend
# This script sets up HTTPS with SSL certificates

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DOMAIN=${1:-"localhost"}
EMAIL=${2:-"admin@example.com"}
SSL_DIR="./ssl"
CERT_FILE="$SSL_DIR/cert.pem"
KEY_FILE="$SSL_DIR/key.pem"

echo -e "${BLUE}🔒 Kunai Backend HTTPS Setup${NC}"
echo "=================================="

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if running as root for Let's Encrypt
check_root() {
    if [[ $EUID -eq 0 ]]; then
        print_warning "Running as root - this is required for Let's Encrypt"
    else
        print_warning "Not running as root - some operations may fail"
    fi
}

# Create SSL directory
create_ssl_dir() {
    print_status "Creating SSL directory..."
    mkdir -p "$SSL_DIR"
    chmod 700 "$SSL_DIR"
}

# Generate self-signed certificate for development
generate_self_signed() {
    print_status "Generating self-signed certificate for development..."
    
    if [[ -f "$CERT_FILE" && -f "$KEY_FILE" ]]; then
        print_warning "SSL certificates already exist. Skipping generation."
        return
    fi
    
    openssl req -x509 -newkey rsa:4096 \
        -keyout "$KEY_FILE" \
        -out "$CERT_FILE" \
        -days 365 \
        -nodes \
        -subj "/C=US/ST=State/L=City/O=Organization/CN=$DOMAIN"
    
    chmod 600 "$KEY_FILE"
    chmod 644 "$CERT_FILE"
    
    print_status "Self-signed certificate generated successfully!"
}

# Get Let's Encrypt certificate
get_letsencrypt() {
    if [[ "$DOMAIN" == "localhost" ]]; then
        print_warning "Skipping Let's Encrypt for localhost"
        return
    fi
    
    print_status "Getting Let's Encrypt certificate for $DOMAIN..."
    
    # Check if certbot is installed
    if ! command -v certbot &> /dev/null; then
        print_error "Certbot is not installed. Please install it first:"
        echo "  Ubuntu/Debian: sudo apt install certbot"
        echo "  CentOS/RHEL: sudo yum install certbot"
        echo "  macOS: brew install certbot"
        exit 1
    fi
    
    # Stop any running services on port 80
    print_status "Stopping services on port 80..."
    sudo systemctl stop nginx 2>/dev/null || true
    sudo systemctl stop apache2 2>/dev/null || true
    
    # Get certificate
    sudo certbot certonly --standalone \
        -d "$DOMAIN" \
        -d "www.$DOMAIN" \
        --email "$EMAIL" \
        --agree-tos \
        --non-interactive
    
    # Copy certificates to project directory
    print_status "Copying certificates to project directory..."
    sudo cp "/etc/letsencrypt/live/$DOMAIN/privkey.pem" "$KEY_FILE"
    sudo cp "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" "$CERT_FILE"
    sudo chown $(whoami):$(whoami) "$KEY_FILE" "$CERT_FILE"
    chmod 600 "$KEY_FILE"
    chmod 644 "$CERT_FILE"
    
    print_status "Let's Encrypt certificate obtained successfully!"
}

# Update environment variables
update_env() {
    print_status "Updating environment variables..."
    
    # Create .env file if it doesn't exist
    if [[ ! -f .env ]]; then
        cp .env.example .env 2>/dev/null || touch .env
    fi
    
    # Update SSL paths in .env
    if [[ "$DOMAIN" == "localhost" ]]; then
        SSL_KEY_PATH="./ssl/key.pem"
        SSL_CERT_PATH="./ssl/cert.pem"
    else
        SSL_KEY_PATH="/etc/letsencrypt/live/$DOMAIN/privkey.pem"
        SSL_CERT_PATH="/etc/letsencrypt/live/$DOMAIN/fullchain.pem"
    fi
    
    # Update .env file
    grep -q "SSL_KEY_PATH" .env && \
        sed -i "s|SSL_KEY_PATH=.*|SSL_KEY_PATH=$SSL_KEY_PATH|" .env || \
        echo "SSL_KEY_PATH=$SSL_KEY_PATH" >> .env
    
    grep -q "SSL_CERT_PATH" .env && \
        sed -i "s|SSL_CERT_PATH=.*|SSL_CERT_PATH=$SSL_CERT_PATH|" .env || \
        echo "SSL_CERT_PATH=$SSL_CERT_PATH" >> .env
    
    # Update CORS origin for HTTPS
    if [[ "$DOMAIN" != "localhost" ]]; then
        grep -q "CORS_ORIGIN" .env && \
            sed -i "s|CORS_ORIGIN=.*|CORS_ORIGIN=https://$DOMAIN|" .env || \
            echo "CORS_ORIGIN=https://$DOMAIN" >> .env
    fi
    
    print_status "Environment variables updated!"
}

# Build the application
build_app() {
    print_status "Building the application..."
    npm run build
}

# Setup PM2
setup_pm2() {
    print_status "Setting up PM2..."
    
    # Install PM2 globally if not installed
    if ! command -v pm2 &> /dev/null; then
        print_status "Installing PM2..."
        npm install -g pm2
    fi
    
    # Start with PM2
    print_status "Starting application with PM2..."
    pm2 start ecosystem.config.js --env production
    pm2 save
    pm2 startup
}

# Setup Docker
setup_docker() {
    print_status "Setting up Docker deployment..."
    
    # Check if Docker is installed
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    # Build and start containers
    print_status "Building Docker image..."
    docker-compose build
    
    print_status "Starting Docker containers..."
    docker-compose up -d
    
    print_status "Docker deployment completed!"
}

# Setup auto-renewal for Let's Encrypt
setup_auto_renewal() {
    if [[ "$DOMAIN" == "localhost" ]]; then
        print_warning "Skipping auto-renewal setup for localhost"
        return
    fi
    
    print_status "Setting up Let's Encrypt auto-renewal..."
    
    # Create renewal script
    cat > renew-ssl.sh << EOF
#!/bin/bash
sudo certbot renew --quiet
sudo cp /etc/letsencrypt/live/$DOMAIN/privkey.pem $KEY_FILE
sudo cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem $CERT_FILE
sudo chown \$(whoami):\$(whoami) $KEY_FILE $CERT_FILE
pm2 reload kunai-backend
EOF
    
    chmod +x renew-ssl.sh
    
    # Add to crontab
    (crontab -l 2>/dev/null; echo "0 12 * * * $(pwd)/renew-ssl.sh") | crontab -
    
    print_status "Auto-renewal setup completed!"
}

# Test HTTPS connection
test_https() {
    print_status "Testing HTTPS connection..."
    
    # Wait for server to start
    sleep 5
    
    # Test with curl
    if curl -k -s "https://localhost:3001/health" > /dev/null; then
        print_status "HTTPS connection test successful!"
    else
        print_warning "HTTPS connection test failed. Server may still be starting..."
    fi
}

# Main execution
main() {
    echo "Domain: $DOMAIN"
    echo "Email: $EMAIL"
    echo ""
    
    check_root
    create_ssl_dir
    
    if [[ "$DOMAIN" == "localhost" ]]; then
        generate_self_signed
    else
        get_letsencrypt
    fi
    
    update_env
    build_app
    
    # Choose deployment method
    echo ""
    echo -e "${BLUE}Choose deployment method:${NC}"
    echo "1) PM2 (Recommended for production)"
    echo "2) Docker (Containerized deployment)"
    echo "3) Skip deployment (Manual setup)"
    read -p "Enter your choice (1-3): " choice
    
    case $choice in
        1)
            setup_pm2
            ;;
        2)
            setup_docker
            ;;
        3)
            print_warning "Skipping deployment. You can start manually with:"
            echo "  npm start"
            echo "  pm2 start ecosystem.config.js --env production"
            echo "  docker-compose up -d"
            ;;
        *)
            print_error "Invalid choice"
            exit 1
            ;;
    esac
    
    if [[ "$DOMAIN" != "localhost" ]]; then
        setup_auto_renewal
    fi
    
    test_https
    
    echo ""
    echo -e "${GREEN}🎉 HTTPS setup completed successfully!${NC}"
    echo ""
    echo -e "${BLUE}Next steps:${NC}"
    echo "1. Update your frontend to use HTTPS URLs"
    echo "2. Configure your domain DNS if using Let's Encrypt"
    echo "3. Test all API endpoints with HTTPS"
    echo "4. Monitor SSL certificate expiration"
    echo ""
    echo -e "${BLUE}Useful commands:${NC}"
    echo "  pm2 status                    # Check PM2 status"
    echo "  pm2 logs kunai-backend       # View logs"
    echo "  docker-compose logs          # View Docker logs"
    echo "  ./renew-ssl.sh               # Manual SSL renewal"
}

# Run main function
main "$@" 