module.exports = {
  apps: [
    {
      name: 'kunai-backend',
      script: 'dist/index.js',
      instances: 'max',
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development',
        PORT: 3001
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001,
        SSL_KEY_PATH: process.env.SSL_KEY_PATH || '/etc/letsencrypt/live/yourdomain.com/privkey.pem',
        SSL_CERT_PATH: process.env.SSL_CERT_PATH || '/etc/letsencrypt/live/yourdomain.com/fullchain.pem',
        CORS_ORIGIN: process.env.CORS_ORIGIN || 'https://yourdomain.com'
      }
    }
  ],

  deploy: {
    production: {
      user: 'deploy',
      host: 'your-server-ip',
      ref: 'origin/main',
      repo: 'git@github.com:yourusername/kunai1.git',
      path: '/var/www/kunai-backend',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    }
  }
}; 