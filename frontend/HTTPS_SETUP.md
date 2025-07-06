# HTTPS Setup for KunAI Frontend

This guide explains how to set up HTTPS for local development with experimental Vite features.

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Generate SSL Certificates
```bash
npm run setup-certs
```

### 3. Start HTTPS Development Server
```bash
npm run dev:secure
```

## Available Scripts

- `npm run dev` - Standard HTTP development server
- `npm run dev:https` - HTTPS development server (requires certificates)
- `npm run dev:secure` - Setup certificates and start HTTPS server
- `npm run setup-certs` - Generate SSL certificates using mkcert
- `npm run preview:https` - Preview build with HTTPS
- `npm run build:analyze` - Build with bundle analysis

## Experimental Features Enabled

### HTTPS Configuration
- **mkcert Integration**: Uses mkcert for trusted local certificates
- **Automatic Certificate Detection**: Falls back to self-signed if mkcert not available
- **WebSocket Secure (WSS)**: HMR over secure WebSocket connection
- **Proxy Support**: Secure API proxy to backend

### Build Optimizations
- **ESNext Target**: Latest JavaScript features
- **Manual Chunking**: Optimized bundle splitting
- **CSS Code Splitting**: Efficient CSS loading
- **Asset Inlining**: Small assets embedded in HTML

### Development Features
- **CSS Source Maps**: Better debugging experience
- **CSS Modules**: Scoped styling with camelCase
- **Dependency Optimization**: Pre-bundled dependencies
- **Environment Variables**: Runtime configuration

### Preview Features
- **HTTPS Preview**: Secure preview server
- **Host Binding**: Accessible from network
- **Port Configuration**: Custom preview port

## Certificate Management

### Automatic Setup
The `setup-certs` script:
1. Creates `certs/` directory
2. Installs mkcert root certificate
3. Generates localhost certificates
4. Supports IPv4 and IPv6 addresses

### Manual Certificate Generation
```bash
# Install mkcert globally
npm install -g mkcert

# Generate certificates manually
mkcert -install
mkcert -key-file ./certs/localhost-key.pem -cert-file ./certs/localhost.pem localhost 127.0.0.1 ::1
```

### Certificate Locations
- **Private Key**: `./certs/localhost-key.pem`
- **Certificate**: `./certs/localhost.pem`
- **Root CA**: System trust store (via mkcert -install)

## Configuration Details

### Server Configuration
```typescript
server: {
  https: getHttpsConfig(), // Automatic certificate detection
  hmr: {
    protocol: 'wss', // Secure WebSocket for HMR
  },
  proxy: {
    '/api': {
      target: 'https://localhost:3001',
      changeOrigin: true,
      secure: false, // Allow self-signed backend certificates
    },
  },
}
```

### Build Configuration
```typescript
build: {
  target: 'esnext',
  minify: 'esbuild',
  cssCodeSplit: true,
  assetsInlineLimit: 4096,
  rollupOptions: {
    output: {
      manualChunks: {
        vendor: ['react', 'react-dom'],
        ui: ['@radix-ui/react-select', '@radix-ui/react-slot'],
        web3: ['ethers', 'viem', 'wagmi'],
      },
    },
  },
}
```

## Troubleshooting

### Certificate Issues
```bash
# Regenerate certificates
npm run setup-certs

# Check certificate validity
openssl x509 -in ./certs/localhost.pem -text -noout
```

### Port Conflicts
```bash
# Check what's using the port
lsof -i :5173

# Kill process using port
kill -9 <PID>
```

### Browser Security Warnings
- Accept the security warning for localhost
- Add exception for self-signed certificates
- Trust the mkcert root certificate

### Network Access
```bash
# Allow network access
npm run dev:https -- --host 0.0.0.0

# Access from other devices
https://<your-ip>:5173
```

## Security Considerations

### Development Only
- Certificates are for local development only
- Never use in production
- mkcert certificates are trusted locally

### Telegram WebApp Integration
- HTTPS required for Telegram WebApp
- Secure WebSocket for real-time features
- API calls over HTTPS proxy

### Environment Variables
```bash
# .env.local
VITE_API_URL=https://localhost:3001
VITE_WS_URL=wss://localhost:3001
VITE_EXPERIMENTAL=true
```

## Performance Benefits

### Faster Development
- Pre-bundled dependencies
- Optimized HMR over WSS
- CSS source maps for debugging

### Better Builds
- Manual chunk splitting
- Asset optimization
- Tree shaking improvements

### Enhanced Debugging
- Source maps enabled
- CSS modules support
- Environment variable injection

## Next Steps

1. **Backend HTTPS**: Configure backend for HTTPS
2. **Environment Variables**: Set up production HTTPS
3. **CI/CD**: Add certificate generation to build pipeline
4. **Monitoring**: Add HTTPS health checks
5. **Documentation**: Update deployment guides 