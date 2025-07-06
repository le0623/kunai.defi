import { Request, Response, NextFunction } from 'express';
import { parse, validate } from '@telegram-apps/init-data-node';
import { logger } from '@/utils/logger';

export const verifyTelegramToken = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const initData = req.headers['telegram-init-data'] as string;
  const botToken = process.env['TELEGRAM_BOT_TOKEN'] as string;

  if (!initData) {
    res.status(401).json({ error: 'No initData provided' });
    return;
  }

  if (!botToken) {
    res.status(500).json({ error: 'Bot token not found' });
    return;
  }

  try {
    validate(initData, botToken, {expiresIn: 10000});
  } catch (error) {
    logger.error('error', error);
    res.status(401).json({ error: 'Invalid initData signature' });
    return;
  }

  const parsed = parse(initData);

  req.telegramUser = parsed.user;
  console.log('Telegram user:', req.telegramUser?.id || 'unknown', req.url);
  next();
};
