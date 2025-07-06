import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { authenticateToken } from '@/middleware/auth';
import { WalletController } from '@/controllers/walletController';

const router = Router();

// Get monitored wallets for authenticated user
router.get('/monitored', authenticateToken, WalletController.getMonitoredWallets);

// Add wallet to monitoring list
router.post('/monitor', 
  authenticateToken,
  [
    body('address').isEthereumAddress().withMessage('Valid Ethereum address required'),
    body('label').optional().isString().trim().isLength({ max: 100 })
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request data',
        errors: errors.array(),
      });
    }
    next();
  },
  WalletController.addWalletToMonitoring
);

// Remove wallet from monitoring
router.delete('/monitor/:address', authenticateToken, WalletController.removeWalletFromMonitoring);

// Get wallet activity
router.get('/activity/:address', authenticateToken, WalletController.getWalletActivity);

// Get wallet portfolio
router.get('/portfolio/:address', authenticateToken, WalletController.getWalletPortfolio);

// Get smart wallet labels
router.get('/labels/:address', authenticateToken, WalletController.getSmartWalletLabel);

// Get alerts for user
router.get('/alerts', authenticateToken, WalletController.getUserAlerts);

// Mark alert as read
router.patch('/alerts/:id/read', authenticateToken, WalletController.markAlertAsRead);

export default router; 