import { Router } from 'express';
import { TgWebAppController } from '@/controllers/tgWebApp';
import { verifyTelegramToken } from '@/middleware/telegram';

const router: Router = Router();

/**
 * @route GET /api/tg-webapp/user/:telegramId
 * @desc Get user data for WebApp
 * @access Private
 */
router.get('/me', verifyTelegramToken, TgWebAppController.getUserData);

/**
 * @route POST /api/tg-webapp/wallet/deploy
 * @desc Deploy proxy wallet
 * @access Private
 */
router.post(
  '/wallet/deploy',
  verifyTelegramToken,
  TgWebAppController.deployProxyWallet
);

/**
 * @route POST /api/tg-webapp/monitor-pool
 * @desc Monitor pool
 * @access Private
 */
router.post(
  '/monitor-pool',
  verifyTelegramToken,
  TgWebAppController.monitorPool
);

/**
 * @route GET /api/tg-webapp/pools
 * @desc Get pools data
 * @access Private
 */
router.get('/pools', verifyTelegramToken, TgWebAppController.getPools);

/**
 * @route POST /api/tg-webapp/trade
 * @desc Execute trade
 * @access Private
 */
router.post('/trade', verifyTelegramToken, TgWebAppController.executeTrade);

/**
 * @route PUT /api/tg-webapp/config
 * @desc Update sniper configuration
 * @access Private
 */
router.put('/config', verifyTelegramToken, TgWebAppController.updateConfig);

export default router;
