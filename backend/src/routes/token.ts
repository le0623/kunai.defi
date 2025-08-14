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
 * @route GET /api/token/:chain/:address/swaps
 * @desc Get token swaps by token address
 * @access Public
 */
router.get('/:chain/:address/swaps', TokenController.getTokenSwaps);

/**
 * @route GET /api/token/:chain/:address/security
 * @desc Get token security from goplus
 * @access Public
 */
router.get('/:chain/:address/security', TokenController.getTokenSecurity);

/**
 * @route POST /api/token/batch
 * @desc Get multiple tokens information in a single request
 * @access Public
 */
router.post('/batch', TokenController.getMultipleTokens);

export default router;
