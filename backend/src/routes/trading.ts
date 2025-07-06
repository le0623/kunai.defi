import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { authenticateToken } from '@/middleware/auth';
import { TradingController } from '@/controllers/tradingController';

const router = Router();

// Trading Bots
router.get('/bots', authenticateToken, TradingController.getTradingBots);

router.post('/bots', 
  authenticateToken,
  [
    body('name').isString().notEmpty().withMessage('Bot name is required'),
    body('config').isObject().withMessage('Bot configuration is required')
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
  TradingController.createTradingBot
);

router.put('/bots/:id', 
  authenticateToken,
  [
    body('name').optional().isString().notEmpty(),
    body('config').optional().isObject(),
    body('isActive').optional().isBoolean()
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
  TradingController.updateTradingBot
);

router.delete('/bots/:id', authenticateToken, TradingController.deleteTradingBot);

// Copy Trading
router.get('/copy-trades', authenticateToken, TradingController.getCopyTrades);

router.post('/copy-trades', 
  authenticateToken,
  [
    body('targetAddress').isEthereumAddress().withMessage('Valid Ethereum address required'),
    body('allocation').isFloat({ min: 0, max: 100 }).withMessage('Allocation must be between 0 and 100'),
    body('maxSlippage').optional().isFloat({ min: 0, max: 10 }).withMessage('Max slippage must be between 0 and 10')
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
  TradingController.setupCopyTrading
);

router.put('/copy-trades/:id', 
  authenticateToken,
  [
    body('allocation').optional().isFloat({ min: 0, max: 100 }),
    body('maxSlippage').optional().isFloat({ min: 0, max: 10 }),
    body('isActive').optional().isBoolean()
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
  TradingController.updateCopyTrading
);

router.delete('/copy-trades/:id', authenticateToken, TradingController.deleteCopyTrading);

export default router; 