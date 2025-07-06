# HTTPS Setup Guide

## Option 1: Using Let's Encrypt (Recommended for Production)

### 1. Install Certbot
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install certbot

# CentOS/RHEL
sudo yum install certbot

# macOS
brew install certbot
```

### 2. Get SSL Certificate
```bash
# For a domain (replace with your domain)
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com

# For localhost development (self-signed)
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes
```

### 3. Set Environment Variables
Add to your `.env` file:
```env
SSL_KEY_PATH=/etc/letsencrypt/live/yourdomain.com/privkey.pem
SSL_CERT_PATH=/etc/letsencrypt/live/yourdomain.com/fullchain.pem
```

### 4. Auto-renewal (Let's Encrypt)
```bash
# Test renewal
sudo certbot renew --dry-run

# Add to crontab for auto-renewal
sudo crontab -e
# Add this line:
0 12 * * * /usr/bin/certbot renew --quiet
```

## Option 2: Using Nginx as Reverse Proxy

### 1. Install Nginx
```bash
sudo apt update
sudo apt install nginx
```

### 2. Configure Nginx
Create `/etc/nginx/sites-available/kunai-app`:
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 3. Enable Site
```bash
sudo ln -s /etc/nginx/sites-available/kunai-app /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## Option 3: Using PM2 with HTTPS

### 1. Install PM2
```bash
npm install -g pm2
```

### 2. Create PM2 Ecosystem File
Create `ecosystem.config.js`:
```javascript
module.exports = {
  apps: [{
    name: 'kunai-backend',
    script: 'dist/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3001,
      SSL_KEY_PATH: '/path/to/your/key.pem',
      SSL_CERT_PATH: '/path/to/your/cert.pem'
    }
  }]
};
```

### 3. Start with PM2
```bash
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

## Option 4: Using Docker with HTTPS

### 1. Create Dockerfile
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY dist ./dist
COPY ssl ./ssl

EXPOSE 3001 443

CMD ["node", "dist/index.js"]
```

### 2. Create docker-compose.yml
```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3001:3001"
      - "443:443"
    environment:
      - NODE_ENV=production
      - SSL_KEY_PATH=/app/ssl/key.pem
      - SSL_CERT_PATH=/app/ssl/cert.pem
    volumes:
      - ./ssl:/app/ssl:ro
```

## Environment Variables

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

## Security Headers

The server already includes security headers via Helmet, but you can customize them:

```javascript
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));
```

## Testing HTTPS

After setup, test your HTTPS connection:
```bash
# Test with curl
curl -k https://localhost:3001/health

# Test with browser
# Navigate to https://yourdomain.com/health
```

## Troubleshooting

### Common Issues:
1. **Permission denied**: Ensure SSL certificate files are readable
2. **Certificate not found**: Check file paths in environment variables
3. **Port already in use**: Change port or stop conflicting services
4. **CORS errors**: Update CORS_ORIGIN to use HTTPS

### Debug Commands:
```bash
# Check SSL certificate
openssl x509 -in cert.pem -text -noout

# Test HTTPS connection
openssl s_client -connect localhost:3001 -servername localhost

# Check server logs
pm2 logs kunai-backend
``` 