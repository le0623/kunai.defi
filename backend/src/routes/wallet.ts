import { NextFunction, Request, Response, Router } from 'express';
import { body, param, validationResult } from 'express-validator';
import { authenticateToken } from '@/middleware/auth';
import { WalletController } from '@/controllers/walletController';

const router: Router = Router();

// Get user's in-app wallet
router.get('/my-wallet', authenticateToken, WalletController.getUserWallet);

// Get current user's wallet balance
router.get('/my-balance', authenticateToken, WalletController.getCurrentUserWalletBalance);

// Get wallet balance
router.get(
  '/balance/:address',
  [
    param('address')
      .isEthereumAddress()
      .withMessage('Valid Ethereum address required'),
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        message: 'Invalid request data',
        errors: errors.array(),
      });
    }
    next();
  },
  WalletController.getWalletBalance
);

// Execute a trade
router.post(
  '/trade',
  authenticateToken,
  [
    body('tokenIn')
      .isEthereumAddress()
      .withMessage('Valid token address required'),
    body('tokenOut')
      .isEthereumAddress()
      .withMessage('Valid token address required'),
    body('amountIn').isString().notEmpty().withMessage('Amount is required'),
    body('minAmountOut')
      .isString()
      .notEmpty()
      .withMessage('Minimum output amount is required'),
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        message: 'Invalid request data',
        errors: errors.array(),
      });
    }
    next();
  },
  WalletController.executeTrade
);

// Fund wallet (for testing/demo)
router.post(
  '/fund',
  [
    body('address')
      .isEthereumAddress()
      .withMessage('Valid Ethereum address required'),
    body('amount').isString().notEmpty().withMessage('Amount is required'),
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        message: 'Invalid request data',
        errors: errors.array(),
      });
    }
    next();
  },
  WalletController.fundWallet
);

// Update wallet configuration
router.put(
  '/config',
  authenticateToken,
  [
    body('maxTradeAmount')
      .optional()
      .isString()
      .withMessage('Max trade amount must be a string'),
    body('maxSlippage')
      .optional()
      .isInt({ min: 0, max: 1000 })
      .withMessage('Max slippage must be 0-1000'),
    body('dailyTradeLimit')
      .optional()
      .isString()
      .withMessage('Daily trade limit must be a string'),
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        message: 'Invalid request data',
        errors: errors.array(),
      });
    }
    next();
  },
  WalletController.updateWalletConfig
);

// Get transaction history
router.get(
  '/history/:address',
  [
    param('address')
      .isEthereumAddress()
      .withMessage('Valid Ethereum address required'),
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        message: 'Invalid request data',
        errors: errors.array(),
      });
    }
    next();
  },
  WalletController.getTransactionHistory
);

export default router;
