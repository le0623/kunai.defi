import { Request, Response } from 'express';
import { geckoTerminalService } from '@/services/geckoterminalService';
import { logger } from '@/utils/logger';
import { goplusService } from '@/services/goplusService';

export class TokenController {
  /**
   * Get token information by chain and address
   * @route GET /api/token/:chain/:address
   * @access Public
   */
  static async getTokenInfo(req: Request, res: Response) {
    try {
      const { chain, address } = req.params;

      // Validate parameters
      if (!chain || !address) {
        return res.status(400).json({
          success: false,
          error: 'Chain and address parameters are required',
        });
      }

      // Validate chain format
      if (!geckoTerminalService.isValidNetwork(chain)) {
        return res.status(400).json({
          success: false,
          error: `Invalid network: ${chain}. Supported networks: eth, bsc, polygon, arbitrum, optimism, avalanche, solana`,
        });
      }

      // Validate address format
      if (!geckoTerminalService.isValidAddress(address)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid token address format',
        });
      }

      logger.info(`Fetching token info for ${chain}/${address}`);

      // Get token information
      const tokenInfo = await geckoTerminalService.getTokenInfo(chain, address);
      const tokenSecurity = await goplusService.getTokenSecurity('1', address);

      return res.json({
        success: true,
        data: {
          tokenInfo,
          tokenSecurity,
          chain,
          lastUpdated: new Date().toISOString(),
        },
      });
    } catch (error) {
      logger.error(`Error fetching token info: ${error}`);

      if (error instanceof Error) {
        if (error.message.includes('Token not found')) {
          return res.status(404).json({
            success: false,
            error: 'Token not found on this network',
          });
        }

        if (error.message.includes('GeckoTerminal API error')) {
          return res.status(503).json({
            success: false,
            error: 'Token data service temporarily unavailable',
          });
        }
      }

      return res.status(500).json({
        success: false,
        error: 'Failed to fetch token information',
      });
    }
  }

  /**
   * Get token price only
   * @route GET /api/token/:chain/:address/price
   * @access Public
   */
  static async getTokenPrice(req: Request, res: Response) {
    try {
      const { chain, address } = req.params;

      // Validate parameters
      if (!chain || !address) {
        return res.status(400).json({
          success: false,
          error: 'Chain and address parameters are required',
        });
      }

      // Validate chain format
      if (!geckoTerminalService.isValidNetwork(chain)) {
        return res.status(400).json({
          success: false,
          error: `Invalid network: ${chain}`,
        });
      }

      // Validate address format
      if (!geckoTerminalService.isValidAddress(address)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid token address format',
        });
      }

      logger.info(`Fetching token price for ${chain}/${address}`);

      // Get token price
      const price = await geckoTerminalService.getTokenPrice(chain, address);

      return res.json({
        success: true,
        data: {
          chain,
          address,
          priceUsd: price,
          lastUpdated: new Date().toISOString(),
        },
      });
    } catch (error) {
      logger.error(`Error fetching token price: ${error}`);

      if (error instanceof Error) {
        if (error.message.includes('Token not found')) {
          return res.status(404).json({
            success: false,
            error: 'Token not found on this network',
          });
        }
      }

      return res.status(500).json({
        success: false,
        error: 'Failed to fetch token price',
      });
    }
  }

  /**
   * Get token market data (price, volume, market cap)
   * @route GET /api/token/:chain/:address/market
   * @access Public
   */
  static async getTokenMarketData(req: Request, res: Response) {
    try {
      const { chain, address } = req.params;

      // Validate parameters
      if (!chain || !address) {
        return res.status(400).json({
          success: false,
          error: 'Chain and address parameters are required',
        });
      }

      // Validate chain format
      if (!geckoTerminalService.isValidNetwork(chain)) {
        return res.status(400).json({
          success: false,
          error: `Invalid network: ${chain}`,
        });
      }

      // Validate address format
      if (!geckoTerminalService.isValidAddress(address)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid token address format',
        });
      }

      logger.info(`Fetching token market data for ${chain}/${address}`);

      // Get token market data
      const marketData = await geckoTerminalService.getTokenMarketData(
        chain,
        address
      );

      return res.json({
        success: true,
        data: {
          chain,
          address,
          price: marketData.price,
          volume24h: marketData.volume24h,
          marketCap: marketData.marketCap,
          fdv: marketData.fdv,
          lastUpdated: new Date().toISOString(),
        },
      });
    } catch (error) {
      logger.error(`Error fetching token market data: ${error}`);

      if (error instanceof Error) {
        if (error.message.includes('Token not found')) {
          return res.status(404).json({
            success: false,
            error: 'Token not found on this network',
          });
        }
      }

      return res.status(500).json({
        success: false,
        error: 'Failed to fetch token market data',
      });
    }
  }

  /**
   * Check if token exists
   * @route GET /api/token/:chain/:address/exists
   * @access Public
   */
  static async checkTokenExists(req: Request, res: Response) {
    try {
      const { chain, address } = req.params;

      // Validate parameters
      if (!chain || !address) {
        return res.status(400).json({
          success: false,
          error: 'Chain and address parameters are required',
        });
      }

      // Validate chain format
      if (!geckoTerminalService.isValidNetwork(chain)) {
        return res.status(400).json({
          success: false,
          error: `Invalid network: ${chain}`,
        });
      }

      // Validate address format
      if (!geckoTerminalService.isValidAddress(address)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid token address format',
        });
      }

      logger.info(`Checking if token exists: ${chain}/${address}`);

      // Check if token exists
      const exists = await geckoTerminalService.tokenExists(chain, address);

      return res.json({
        success: true,
        data: {
          chain,
          address,
          exists,
          lastChecked: new Date().toISOString(),
        },
      });
    } catch (error) {
      logger.error(`Error checking token existence: ${error}`);

      return res.status(500).json({
        success: false,
        error: 'Failed to check token existence',
      });
    }
  }

  /**
   * Get multiple tokens information
   * @route POST /api/token/batch
   * @access Public
   */
  static async getMultipleTokens(req: Request, res: Response) {
    try {
      const { tokens } = req.body;

      // Validate request body
      if (!tokens || !Array.isArray(tokens)) {
        return res.status(400).json({
          success: false,
          error: 'Request body must contain a "tokens" array',
        });
      }

      // Validate each token object
      for (const token of tokens) {
        if (!token.network || !token.address) {
          return res.status(400).json({
            success: false,
            error: 'Each token must have "network" and "address" properties',
          });
        }

        if (!geckoTerminalService.isValidNetwork(token.network)) {
          return res.status(400).json({
            success: false,
            error: `Invalid network: ${token.network}`,
          });
        }

        if (!geckoTerminalService.isValidAddress(token.address)) {
          return res.status(400).json({
            success: false,
            error: `Invalid address format: ${token.address}`,
          });
        }
      }

      // Limit batch size
      if (tokens.length > 50) {
        return res.status(400).json({
          success: false,
          error: 'Maximum 50 tokens allowed per request',
        });
      }

      logger.info(`Fetching batch token info for ${tokens.length} tokens`);

      // Get multiple tokens information
      const tokenInfos =
        await geckoTerminalService.getMultipleTokensInfo(tokens);

      return res.json({
        success: true,
        data: {
          tokens: tokenInfos.map(tokenInfo => ({
            address: tokenInfo.address,
            name: tokenInfo.name,
            symbol: tokenInfo.symbol,
            decimals: tokenInfo.decimals,
            imageUrl: tokenInfo.imageUrl,
            priceUsd: tokenInfo.priceUsd,
            volume24h: tokenInfo.volume24h,
            marketCapUsd: tokenInfo.marketCapUsd,
            fdvUsd: tokenInfo.fdvUsd,
          })),
          total: tokenInfos.length,
          requested: tokens.length,
          lastUpdated: new Date().toISOString(),
        },
      });
    } catch (error) {
      logger.error(`Error fetching batch token info: ${error}`);

      return res.status(500).json({
        success: false,
        error: 'Failed to fetch batch token information',
      });
    }
  }
}
