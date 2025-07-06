# Telegram WebApp for KunAI Sniper Bot

This document describes the Telegram WebApp implementation for the KunAI Sniper Bot.

## Overview

The Telegram WebApp provides a rich, interactive interface for users to manage their sniper bot directly within Telegram. It includes all the features available in the bot commands but with a modern, user-friendly interface.

## Features

### 🏠 Dashboard
- Real-time status monitoring
- Quick action buttons
- Recent pools overview
- Performance metrics

### 🔐 Wallet Management
- Set up wallet address
- Deploy proxy wallet
- View wallet status
- Manage approvals

### ⚙️ Configuration
- Sniper settings (slippage, gas limits)
- Trading limits
- Auto-sell configuration
- Filter settings

### 📊 Monitoring
- Start/stop pool monitoring
- View recent pools
- Pool analysis (honeypot detection, lock status)
- Quick trade execution

### 💰 Trading
- Manual trade execution
- Trade history
- Transaction status
- Portfolio overview

### 📈 Portfolio
- Total portfolio value
- Holdings breakdown
- Performance metrics
- 24h changes

### 🚨 Alerts
- Price alerts management
- Recent notifications
- Alert history

## Technical Implementation

### Frontend (React + TypeScript)

**Location**: `frontend/src/pages/TelegramWebApp.tsx`

**Key Components**:
- Telegram WebApp SDK integration
- Responsive design for mobile
- Dark theme optimized for Telegram
- Real-time data updates

**Features**:
- Tab-based navigation
- Form validation
- Error handling
- Loading states
- Copy-to-clipboard functionality

### Backend (Node.js + Express)

**Location**: `backend/src/routes/telegramWebApp.ts`

**API Endpoints**:
- `GET /api/telegram-webapp/user/:telegramId` - Get user data
- `POST /api/telegram-webapp/wallet/setup` - Set wallet address
- `POST /api/telegram-webapp/wallet/deploy` - Deploy proxy wallet
- `GET /api/telegram-webapp/pools` - Get pools data
- `POST /api/telegram-webapp/trade` - Execute trade
- `PUT /api/telegram-webapp/config` - Update configuration

### Bot Integration

**Location**: `backend/src/services/telegramBotService.ts`

**New Commands**:
- `/webapp` - Opens the WebApp
- WebApp button in welcome message

## Setup Instructions

### 1. Frontend Setup

1. Install dependencies:
```bash
cd frontend
npm install
```

2. Build the project:
```bash
npm run build
```

3. Deploy to your hosting service (Vercel, Netlify, etc.)

### 2. Backend Setup

1. The WebApp routes are already integrated into the main server
2. Update the WebApp URL in the bot service:
   ```typescript
   // In telegramBotService.ts
   { text: '🌐 Open WebApp', web_app: { url: 'https://your-domain.com/webapp' } }
   ```

### 3. Bot Configuration

1. Set up your bot with BotFather
2. Configure the WebApp URL in your bot settings
3. Test the WebApp integration

## Usage

### For Users

1. Start the bot with `/start`
2. Click "🌐 Open WebApp" button
3. Complete wallet setup
4. Configure sniper settings
5. Start monitoring pools
6. Execute trades

### For Developers

1. **Adding New Features**:
   - Add new tabs in `TelegramWebApp.tsx`
   - Create corresponding API endpoints
   - Update the bot service if needed

2. **Styling**:
   - Use Tailwind CSS classes
   - Follow the dark theme pattern
   - Ensure mobile responsiveness

3. **API Integration**:
   - Replace mock data with real API calls
   - Add proper error handling
   - Implement loading states

## Security Considerations

1. **Telegram WebApp Validation**:
   - Validate `initData` from Telegram
   - Verify user authentication
   - Implement proper CORS

2. **API Security**:
   - Rate limiting
   - Input validation
   - SQL injection prevention
   - XSS protection

3. **Wallet Security**:
   - Never store private keys
   - Use proxy wallet pattern
   - Implement proper approval flows

## Deployment

### Frontend Deployment

1. **Vercel** (Recommended):
   ```bash
   npm install -g vercel
   vercel --prod
   ```

2. **Netlify**:
   - Connect your GitHub repository
   - Set build command: `npm run build`
   - Set publish directory: `dist`

3. **Custom Domain**:
   - Configure your domain
   - Update bot WebApp URL
   - Set up SSL certificate

### Backend Deployment

1. **Environment Variables**:
   ```env
   TELEGRAM_BOT_TOKEN=your_bot_token
   DATABASE_URL=your_database_url
   CORS_ORIGIN=https://your-frontend-domain.com
   ```

2. **Database Migration**:
   ```bash
   npx prisma migrate deploy
   ```

## Testing

### Local Development

1. **Frontend**:
   ```bash
   cd frontend
   npm run dev
   ```

2. **Backend**:
   ```bash
   cd backend
   npm run dev
   ```

3. **Test WebApp**:
   - Use Telegram's @BotFather test bot
   - Set WebApp URL to `http://localhost:5173/webapp`

### Production Testing

1. Test all WebApp features
2. Verify API endpoints
3. Check error handling
4. Test mobile responsiveness
5. Validate security measures

## Troubleshooting

### Common Issues

1. **WebApp not loading**:
   - Check CORS configuration
   - Verify WebApp URL in bot settings
   - Check browser console for errors

2. **API errors**:
   - Check server logs
   - Verify database connection
   - Check environment variables

3. **Styling issues**:
   - Ensure Tailwind CSS is loaded
   - Check mobile viewport
   - Verify dark theme classes

### Debug Mode

Enable debug logging:
```typescript
// In telegramBotService.ts
logger.debug('WebApp data:', WebApp.initData);
```

## Future Enhancements

1. **Real-time Updates**:
   - WebSocket integration
   - Live portfolio updates
   - Real-time trade notifications

2. **Advanced Features**:
   - Chart integration
   - Advanced filtering
   - Multi-chain support

3. **User Experience**:
   - Offline support
   - Push notifications
   - Custom themes

## Support

For technical support:
- Email: support@kunai.com
- Telegram: @kunai_support
- Documentation: https://docs.kunai.com

## License

This project is licensed under the MIT License. 