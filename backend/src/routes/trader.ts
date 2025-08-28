import { Router } from 'express';
import { TraderController } from '@/controllers/traderController';
import { authenticateToken } from '@/middleware/auth';

const router: Router = Router();

// Public routes
router.get('/rank', TraderController.getTradersByRank);
router.get('/stats', TraderController.getTraderStats);
router.get('/:address', TraderController.getTraderDetails);

// Protected routes (require authentication)
router.post('/track', authenticateToken, TraderController.trackTrader);
router.post('/untrack', authenticateToken, TraderController.untrackTrader);
router.get('/user/copy-trades', authenticateToken, TraderController.getUserCopyTrades);

// Copy trade CRUD operations
router.post('/copy-trades', authenticateToken, TraderController.createCopyTrade);
router.put('/copy-trades/:id', authenticateToken, TraderController.updateCopyTrade);
router.delete('/copy-trades/:id', authenticateToken, TraderController.deleteCopyTrade);

// Trade management endpoints
router.post('/trades', TraderController.addTrade);
router.put('/trades/:tradeId/profit', TraderController.updateTradeProfit);

export default router; 