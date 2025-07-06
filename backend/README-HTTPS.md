# Quick HTTPS Setup Guide

## 🚀 Quick Start

### For Development (Self-signed certificate)
```bash
# Generate self-signed certificate
openssl req -x509 -newkey rsa:4096 -keyout ssl/key.pem -out ssl/cert.pem -days 365 -nodes

# Add to .env file
SSL_KEY_PATH=./ssl/key.pem
SSL_CERT_PATH=./ssl/cert.pem

# Start server
npm run dev
```

### For Production (Let's Encrypt)
```bash
# Run the automated setup script
./deploy-https.sh yourdomain.com your@email.com

# Or manually:
# 1. Install certbot
sudo apt install certbot

# 2. Get certificate
sudo certbot certonly --standalone -d yourdomain.com

# 3. Add to .env file
SSL_KEY_PATH=/etc/letsencrypt/live/yourdomain.com/privkey.pem
SSL_CERT_PATH=/etc/letsencrypt/live/yourdomain.com/fullchain.pem
CORS_ORIGIN=https://yourdomain.com

# 4. Start with PM2
pm2 start ecosystem.config.js --env production
```

## 📁 Files Created

- `ssl-setup.md` - Comprehensive HTTPS setup guide
- `ecosystem.config.js` - PM2 configuration for production
- `Dockerfile` - Docker container configuration
- `docker-compose.yml` - Multi-container deployment
- `nginx.conf` - Nginx reverse proxy configuration
- `deploy-https.sh` - Automated deployment script

## 🔧 Environment Variables

Add these to your `.env` file:
```env
# SSL Configuration
SSL_KEY_PATH=/path/to/your/private/key.pem
SSL_CERT_PATH=/path/to/your/certificate.pem

# Server Configuration
PORT=3001
NODE_ENV=production

# CORS (update for HTTPS)
CORS_ORIGIN=https://yourdomain.com
```

## 🐳 Docker Deployment

```bash
# Build and start with Docker
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## 📊 PM2 Deployment

```bash
# Start with PM2
pm2 start ecosystem.config.js --env production

# Monitor
pm2 status
pm2 logs kunai-backend

# Restart
pm2 restart kunai-backend
```

## 🔍 Testing

```bash
# Test HTTPS connection
curl -k https://localhost:3001/health

# Test with browser
# Navigate to https://yourdomain.com/health
```

## 🔄 Auto-renewal (Let's Encrypt)

The deployment script automatically sets up certificate renewal:
```bash
# Manual renewal
./renew-ssl.sh

# Check renewal status
sudo certbot certificates
```

## 🛠️ Troubleshooting

### Common Issues:
1. **Permission denied**: Ensure SSL files are readable
2. **Certificate not found**: Check file paths in environment variables
3. **Port conflicts**: Change port or stop conflicting services
4. **CORS errors**: Update CORS_ORIGIN to use HTTPS

### Debug Commands:
```bash
# Check SSL certificate
openssl x509 -in ssl/cert.pem -text -noout

# Test HTTPS connection
openssl s_client -connect localhost:3001 -servername localhost

# Check server logs
pm2 logs kunai-backend
docker-compose logs kunai-backend
```

## 🔒 Security Features

The server includes:
- ✅ HTTPS/SSL encryption
- ✅ Security headers (HSTS, CSP, etc.)
- ✅ Rate limiting
- ✅ CORS protection
- ✅ Input validation
- ✅ SQL injection protection

## 📞 Support

If you encounter issues:
1. Check the logs: `pm2 logs` or `docker-compose logs`
2. Verify SSL certificates: `openssl x509 -in cert.pem -text`
3. Test connectivity: `curl -k https://localhost:3001/health`
4. Review the comprehensive guide in `ssl-setup.md` 