import {
  createSiweMessage,
  generateSiweNonce,
  parseSiweMessage,
} from 'viem/siwe';
import { getAddress } from 'viem';
import jwt, { JwtPayload, SignOptions } from 'jsonwebtoken';
import { prisma } from '@/config/database';
import { logger } from '@/utils/logger';
import { publicClient } from '@/utils/client';
import { User } from '@prisma/client';
import { EmailService } from './emailService';
import { WalletService } from './walletService';

export class AuthService {
  private static readonly JWT_SECRET: string =
    process.env['JWT_SECRET'] || 'your-secret-key';
  private static readonly JWT_EXPIRES_IN =
    process.env['JWT_EXPIRES_IN'] || '7d';

  /**
   * Generate a new nonce for SIWE authentication
   */
  static async generateNonce(): Promise<string> {
    return generateSiweNonce();
  }

  /**
   * Create SIWE message for authentication
   */
  static createSiweMessage(
    address: string,
    nonce: string,
    chainId: number
  ): string {
    const domain = process.env['DOMAIN'] || 'localhost:3000';
    const uri = process.env['URI'] || 'http://localhost:3000';

    const message = createSiweMessage({
      domain,
      address: getAddress(address),
      statement: 'Sign in with Ethereum to KunAI.',
      uri,
      version: '1',
      chainId,
      nonce,
    });

    return message;
  }

  /**
   * Verify SIWE signature and authenticate user
   */
  static async verifySignatureAndGenerateToken(
    message: string,
    signature: `0x${string}`
  ): Promise<string | null> {
    try {
      // Verify the SIWE message
      const isValid = await publicClient.verifySiweMessage({
        message,
        signature,
      });

      console.log('isValid', isValid);

      if (!isValid) {
        return null;
      }

      const { address, nonce } = parseSiweMessage(message);

      console.log('address', address);
      console.log('nonce', nonce);

      if (!address) {
        return null;
      }

      // Generate JWT token
      const token = jwt.sign(
        { data: { address: address } },
        Buffer.from(this.JWT_SECRET),
        { expiresIn: this.JWT_EXPIRES_IN } as SignOptions
      );

      return token;
    } catch (error) {
      logger.error('Error verifying signature:', error);
      return null;
    }
  }

  /**
   * Verify JWT token
   */
  static verifyToken(token: string): JwtPayload | null {
    try {
      const decoded = jwt.verify(token, this.JWT_SECRET) as JwtPayload;
      return decoded;
    } catch (error) {
      logger.error('Error verifying token:', error);
      return null;
    }
  }

  /**
   * Send verification code to email
   */
  static async sendVerificationCode(email: string): Promise<boolean> {
    try {
      // Generate verification code
      const code = EmailService.generateVerificationCode();
      const expiresAt = new Date(Date.now() + 60 * 1000); // 60 seconds

      // Save or update verification code
      await prisma.user.upsert({
        where: { email: email.toLowerCase() },
        update: {
          verificationCode: code,
          verificationCodeExpires: expiresAt,
        },
        create: {
          email: email.toLowerCase(),
          verificationCode: code,
          verificationCodeExpires: expiresAt,
        },
      });

      // Send email
      const emailSent = await EmailService.sendVerificationCode(email, code);

      if (emailSent) {
        logger.info(`Verification code sent to ${email}`);
        return true;
      } else {
        // Clean up if email failed to send
        await prisma.user.update({
          where: { email: email.toLowerCase() },
          data: {
            verificationCode: null,
            verificationCodeExpires: null,
          },
        });
        return false;
      }
    } catch (error) {
      logger.error(`Error sending verification code to ${email}:`, error);
      return false;
    }
  }

  /**
   * Generate telegram login link 
   */
  static async generateTelegramLoginLink(userId: string, refCode?: string): Promise<string> {
    try {
      const code = EmailService.generateVerificationCode();
      const expiresAt = new Date(Date.now() + 60 * 1000); // 60 seconds

      // Save or update verification code
      await prisma.user.upsert({
        where: { telegramUserId: userId },
        update: {
          verificationCode: code,
          verificationCodeExpires: expiresAt,
        },
        create: {
          telegramUserId: userId,
          verificationCode: code,
          verificationCodeExpires: expiresAt,
        },
      });

      let loginUrl = `https://kunai.trade/tgauth?code=${code}&user_id=${userId}`;
      if (refCode) {
        loginUrl += `&refCode=${encodeURIComponent(refCode)}`;
      }

      return loginUrl;
    } catch (error) {
      return "https://kunai.trade";
    }
  }

  /**
   * Verify telegram login and complete authentication
   */
  static async verifyTelegramLogin(
    userId: string,
    code: string,
    refCode?: string
  ): Promise<{ success: boolean; token?: string; message: string }> {
    try {
      const user = await prisma.user.findUnique({
        where: { telegramUserId: userId },
        include: {
          inAppWallet: true,
        },
      });

      if (!user) {
        return { success: false, message: 'User not found' };
      }

      if (!user.verificationCode || !user.verificationCodeExpires) {
        return { success: false, message: 'No verification code found' };
      }

      // Check if code is expired
      if (new Date() > user.verificationCodeExpires) {
        return { success: false, message: 'Verification code has expired' };
      }

      // Check if code matches
      if (user.verificationCode !== code) {
        return { success: false, message: 'Invalid verification code' };
      }

      // Update user - clear verification code
      const updateData: any = {
        verificationCode: null,
        verificationCodeExpires: null,
      };

      // Check if this is a first-time login (no in-app wallet exists)
      const isFirstTimeLogin = !user.inAppWallet;

      if (isFirstTimeLogin) {
        // This is a first-time login process
        logger.info(`First-time login process for Telegram user ${userId}`);

        // Handle referral code if provided
        if (refCode) {
          const referrer = await prisma.user.findUnique({
            where: { inviteCode: refCode },
          });

          if (referrer) {
            updateData.invitedByUserId = referrer.id;
            logger.info(
              `Telegram user ${userId} referred by ${referrer.id} using referral code ${refCode}`
            );
          } else {
            logger.warn(
              `Invalid referral code ${refCode} used by Telegram user ${userId}`
            );
          }
        }

        // Create in-app wallet for new user
        try {
          const wallet = await WalletService.createInAppWallet(user.id);
          logger.info(
            `Created in-app wallet for new Telegram user ${user.id}: ${wallet.address}`
          );
        } catch (walletError) {
          logger.error(
            `Failed to create wallet for Telegram user ${user.id}:`,
            walletError
          );
          // Don't fail the login if wallet creation fails
        }
      } else {
        // This is a regular login process
        logger.info(
          `Regular login process for existing Telegram user ${userId}`
        );
      }

      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: updateData,
      });

      // Generate JWT token
      const token = jwt.sign(
        { data: { id: updatedUser.id } },
        Buffer.from(this.JWT_SECRET),
        { expiresIn: this.JWT_EXPIRES_IN } as SignOptions
      );

      logger.info(
        `Telegram login verified for user ${userId} - ${isFirstTimeLogin ? 'First-time login' : 'Regular login'} completed`
      );
      return {
        success: true,
        token,
        message: isFirstTimeLogin
          ? 'Account created successfully!'
          : 'Login successful!',
      };
    } catch (error) {
      logger.error(`Error verifying Telegram login for user ${userId}:`, error);
      return { success: false, message: 'Verification failed' };
    }
  }

  /**
   * Verify email code and complete registration/login
   */
  static async verifyEmailCode(
    email: string,
    code: string,
    inviteCode?: string
  ): Promise<{ success: boolean; token?: string; message: string }> {
    try {
      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
        include: {
          inAppWallet: true,
        },
      });

      if (!user) {
        return { success: false, message: 'User not found' };
      }

      if (!user.verificationCode || !user.verificationCodeExpires) {
        return { success: false, message: 'No verification code found' };
      }

      // Check if code is expired
      if (new Date() > user.verificationCodeExpires) {
        return { success: false, message: 'Verification code has expired' };
      }

      // Check if code matches
      if (user.verificationCode !== code) {
        return { success: false, message: 'Invalid verification code' };
      }

      // Update user - clear verification code
      const updateData: any = {
        verificationCode: null,
        verificationCodeExpires: null,
      };

      // Check if this is a sign-up (no in-app wallet exists)
      const isSignUp = !user.inAppWallet;

      if (isSignUp) {
        // This is a sign-up process
        logger.info(`Sign-up process for user ${user.id} with email ${email}`);

        // Handle invite code if provided
        if (inviteCode) {
          const inviter = await prisma.user.findUnique({
            where: { inviteCode: inviteCode },
          });

          if (inviter) {
            updateData.invitedByUserId = inviter.id;
            logger.info(
              `User ${user.id} invited by ${inviter.id} using invite code ${inviteCode}`
            );
          } else {
            logger.warn(
              `Invalid invite code ${inviteCode} used by user ${user.id}`
            );
          }
        }

        // Create in-app wallet for new user
        try {
          const wallet = await WalletService.createInAppWallet(user.id);
          logger.info(
            `Created in-app wallet for new user ${user.id}: ${wallet.address}`
          );
        } catch (walletError) {
          logger.error(
            `Failed to create wallet for user ${user.id}:`,
            walletError
          );
          // Don't fail the signup if wallet creation fails
        }
      } else {
        // This is a sign-in process
        logger.info(
          `Sign-in process for existing user ${user.id} with email ${email}`
        );
      }

      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: updateData,
      });

      // Generate JWT token
      const token = jwt.sign(
        { data: { id: updatedUser.id } },
        Buffer.from(this.JWT_SECRET),
        { expiresIn: this.JWT_EXPIRES_IN } as SignOptions
      );

      logger.info(
        `Email verified for ${email} - ${isSignUp ? 'Sign-up' : 'Sign-in'} completed`
      );
      return {
        success: true,
        token,
        message: isSignUp
          ? 'Account created successfully!'
          : 'Login successful!',
      };
    } catch (error) {
      logger.error(`Error verifying email code for ${email}:`, error);
      return { success: false, message: 'Verification failed' };
    }
  }

  /**
   * Get user by email
   */
  static async getUserByEmail(email: string): Promise<User | null> {
    try {
      return await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      });
    } catch (error) {
      logger.error(`Error getting user by email ${email}:`, error);
      return null;
    }
  }
}
