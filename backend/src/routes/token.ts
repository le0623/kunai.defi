import { Router } from 'express';
import { TokenController } from '@/controllers/tokenController';

const router: Router = Router();

/**
 * @route GET /api/token/:chain/:address
 * @desc Get complete token information by chain and address
 * @access Public
 */
router.get('/:chain/:address', TokenController.getTokenInfo);

/**
 * @route GET /api/token/:chain/:address/price
 * @desc Get token price only
 * @access Public
 */
router.get('/:chain/:address/price', TokenController.getTokenPrice);

/**
 * @route GET /api/token/:chain/:address/market
 * @desc Get token market data (price, volume, market cap, FDV)
 * @access Public
 */
router.get('/:chain/:address/market', TokenController.getTokenMarketData);

/**
 * @route GET /api/token/:chain/:address/exists
 * @desc Check if token exists on the specified network
 * @access Public
 */
router.get('/:chain/:address/exists', TokenController.checkTokenExists);

/**
 * @route POST /api/token/batch
 * @desc Get multiple tokens information in a single request
 * @access Public
 */
router.post('/batch', TokenController.getMultipleTokens);

export default router;
