import { Request, Response } from 'express';
import { AuthService } from '@/services/authService';
import { logger } from '@/utils/logger';
import { AuthRequest } from '@/types/auth';
import { prisma } from '@/config/database';

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
        message: 'Nonce generated successfully',
      });
    } catch (error) {
      logger.error('Error generating nonce:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate nonce',
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
          message: 'Message and signature are required',
        });
        return;
      }

      const token = await AuthService.verifySignatureAndGenerateToken(
        message,
        signature
      );

      if (!token) {
        res.status(401).json({
          success: false,
          message: 'Invalid signature',
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
        message: 'Authentication failed',
      });
    }
  }

  /**
   * Send verification code to email
   */
  static async sendVerificationCode(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const { email } = req.body;

      if (!email) {
        res.status(400).json({
          success: false,
          message: 'Email is required',
        });
        return;
      }

      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        res.status(400).json({
          success: false,
          message: 'Invalid email format',
        });
        return;
      }

      const success = await AuthService.sendVerificationCode(email);

      if (success) {
        res.json({
          success: true,
          message: 'Verification code sent to your email',
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Failed to send verification code',
        });
      }
    } catch (error) {
      logger.error('Error sending verification code:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send verification code',
      });
    }
  }

  /**
   * Verify email code and complete registration/login
   */
  static async verifyEmailCode(req: Request, res: Response): Promise<void> {
    try {
      const { email, code, inviteCode } = req.body;

      if (!email || !code) {
        res.status(400).json({
          success: false,
          message: 'Email and verification code are required',
        });
        return;
      }

      const result = await AuthService.verifyEmailCode(email, code, inviteCode);

      if (result.success) {
        res.json({
          success: true,
          token: result.token,
          message: result.message,
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.message,
        });
      }
    } catch (error) {
      logger.error('Error verifying email code:', error);
      res.status(500).json({
        success: false,
        message: 'Verification failed',
      });
    }
  }

  /**
   * Get current user information
   */
  static async getCurrentUser(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          inAppWallet: true,
        },
      });

      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found',
        });
        return;
      }

      res.json({
        success: true,
        user: {
          email: user.email,
          inAppWallet: user.inAppWallet?.address,
          createdAt: user.createdAt,
        },
      });
    } catch (error) {
      logger.error('Error getting current user:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get user information',
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
        message: 'Logout successful',
      });
    } catch (error) {
      logger.error('Error during logout:', error);
      res.status(500).json({
        success: false,
        message: 'Logout failed',
      });
    }
  }
}
