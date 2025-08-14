import { Request, Response } from 'express';
import { geckoTerminalService } from '@/services/geckoterminalService';
import { logger } from '@/utils/logger';
import { goplusService } from '@/services/goplusService';
import { moralisService } from '@/services';

export class TokenController {
  /**
   * Get token information by chain and address
   * @route GET /api/token/:chain/:address
   * @access Public
   */
  static async getTokenInfo(req: Request, res: Response) {
    try {
      const { chain, address } = req.params;

      if (!chain || !address) {
        return res.status(400).json({
          success: false,
          error: 'Chain and address parameters are required',
        });
      }

      const tokenInfo = await geckoTerminalService.getTokenInfo(chain, address);
      const moralisToken = (await moralisService.getTokensMetadata(chain, [address]))[0];
      // const moralisTokenDetail = await moralisService.getTokenDetail(chain, address);
      const moralisTokenAnalytics = await moralisService.getTokenAnalytics(chain, address);

      // const tokenSecurity = await goplusService.getTokenSecurity(chain, address);

      return res.json({
        success: true,
        data: {
          tokenInfo,
          moralisToken,
          // moralisTokenDetail,
          moralisTokenAnalytics,
          // tokenSecurity,
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
   * Get token security from goplus
   * @route GET /api/token/:chain/:address/security
   * @access Public
   */
  static async getTokenSecurity(req: Request, res: Response) {
    try {
      const { chain, address } = req.params;
      if (!chain || !address) {
        return res.status(400).json({
          success: false,
          error: 'Chain and address parameters are required',
        });
      }
      
      const security = await goplusService.getTokenSecurity(chain, address);

      return res.json({
        success: true,
        data: security,
      });
    } catch (error) {
      logger.error(`Error fetching token security: ${error}`);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch token security',
      });
    }
  }

  /**
   * Get token swaps by token address
   */
  static async getTokenSwaps(req: Request, res: Response) {
    const { chain, address } = req.params;
    if (!chain || !address) {
      return res.status(400).json({
        success: false,
        error: 'Chain and address parameters are required',
      });
    }
    const swaps = await moralisService.getSwapsByTokenAddress({
      chain,
      address,
    });
    return res.json({
      success: true,
      data: swaps,
    });
  }

  /**
   * Get multiple tokens information
   * @route POST /api/token/batch
   * @access Public
   */
  static async getMultipleTokens(req: Request, res: Response) {
    try {
      const { chain, addresses } = req.body;

      // Validate request body
      if (!chain || !addresses || !Array.isArray(addresses)) {
        return res.status(400).json({
          success: false,
          error: 'Request body must contain a "chain" and "addresses" array',
        });
      }

      if (addresses.length > 50) {
        return res.status(400).json({
          success: false,
          error: 'Maximum 50 tokens allowed per request',
        });
      }

      const tokenInfos =
        await geckoTerminalService.getMultipleTokensInfo(chain, addresses);

      return res.json({
        success: true,
        data: tokenInfos,
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
