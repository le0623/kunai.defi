import { Request, Response } from 'express';
import { AuthService } from '@/services/authService';
import { logger } from '@/utils/logger';
import { AuthRequest } from '@/types/auth';

export class AuthController {
  /**
   * Generate nonce for SIWE authentication
   */
  static async generateNonce(_req: Request, res: Response): Promise<void> {
    try {
      const nonce = await AuthService.generateNonce();
      
      res.json({
        success: true,
        nonce,
        message: 'Nonce generated successfully'
      });
    } catch (error) {
      logger.error('Error generating nonce:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate nonce'
      });
    }
  }

  /**
   * Verify SIWE signature and authenticate user
   */
  static async verifySignature(req: Request, res: Response): Promise<void> {
    try {
      const { message, signature } = req.body as AuthRequest;

      if (!message || !signature) {
        res.status(400).json({
          success: false,
          message: 'Message and signature are required'
        });
        return;
      }

      const token = await AuthService.verifySignatureAndGenerateToken(message, signature);

      if (!token) {
        res.status(401).json({
          success: false,
          message: 'Invalid signature'
        });
        return;
      }

      res.json({
        success: true,
        token,
      });
    } catch (error) {
      logger.error('Error verifying signature:', error);
      res.status(500).json({
        success: false,
        message: 'Authentication failed'
      });
    }
  }

  /**
   * Get current user information
   */
  static async getCurrentUser(req: Request, res: Response): Promise<void> {
    try {
      const userAddress = req.user?.address;
      
      if (!userAddress) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
        return;
      }

      const user = await AuthService.getOrCreateUser(userAddress);

      res.json({
        success: true,
        user: {
          address: user.address,
          createdAt: user.createdAt
        }
      });
    } catch (error) {
      logger.error('Error getting current user:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get user information'
      });
    }
  }

  /**
   * Logout user (invalidate token)
   */
  static async logout(_req: Request, res: Response): Promise<void> {
    try {
      // In a real implementation, you might want to blacklist the token
      // For now, we'll just return success as JWT tokens are stateless
      
      res.json({
        success: true,
        message: 'Logout successful'
      });
    } catch (error) {
      logger.error('Error during logout:', error);
      res.status(500).json({
        success: false,
        message: 'Logout failed'
      });
    }
  }
} 