import { Router } from 'express';
import { PoolController } from '@/controllers/poolController';

const router: Router = Router();

/**
 * @route GET /api/pools
 * @desc Unified endpoint to get pools with all available filters
 * @access Private
 */
router.get('/', PoolController.getPools);

/**
 * @route GET /api/pools/trending/:chain
 * @desc Get trending pools
 * @access Private
 */
router.get('/trending', PoolController.getTrendingPools);

/**
 * @route GET /api/pools/filters
 * @desc Get available filters and their options
 * @access Private
 */
router.get('/filters', PoolController.getAvailableFilters);

/**
 * @route GET /api/pools/rank
 * @desc Get new pairs by rank with pagination and filtering
 * @access Private
 */
router.get('/rank', PoolController.getNewPairsByRank);

/**
 * @route GET /api/pools/all
 * @desc Get all pools (unified endpoint for new, burnt, dexscreener)
 * @access Private
 */
router.get('/all', PoolController.getAllPools);

/**
 * @route GET /api/pools/new
 * @desc Get new pools
 * @access Private
 */
router.get('/new', PoolController.getNewPools);

/**
 * @route GET /api/pools/burnt
 * @desc Get burnt/locked pools
 * @access Private
 */
router.get('/burnt', PoolController.getBurntPools);

/**
 * @route GET /api/pools/dexscreener-spent
 * @desc Get dexscreener spent pools
 * @access Private
 */
router.get('/dexscreener-spent', PoolController.getDexscreenerSpentPools);

export default router;
