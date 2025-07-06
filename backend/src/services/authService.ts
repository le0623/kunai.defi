import { createSiweMessage, generateSiweNonce, parseSiweMessage } from 'viem/siwe';
import { getAddress } from 'viem';
import jwt, { SignOptions } from 'jsonwebtoken';
import { prisma } from '@/config/database';
import { logger } from '@/utils/logger';
import { publicClient } from '@/utils/client';
import { User } from '@prisma/client';
import { Token } from '@/types/auth';

export class AuthService {
  private static readonly JWT_SECRET: string = process.env['JWT_SECRET'] || 'your-secret-key';
  private static readonly JWT_EXPIRES_IN = process.env['JWT_EXPIRES_IN'] || '7d';

  /**
   * Generate a new nonce for SIWE authentication
   */
  static async generateNonce(): Promise<string> {
    return generateSiweNonce();
  }

  /**
   * Create SIWE message for authentication
   */
  static createSiweMessage(address: string, nonce: string, chainId: number): string {
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
  static async verifySignatureAndGenerateToken(message: string, signature: `0x${string}`): Promise<string | null> {
    try {
      // Verify the SIWE message
      const isValid = await publicClient.verifySiweMessage({ message, signature });

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

      const user = await this.getOrCreateUser(address);

      // Generate JWT token
      const token = jwt.sign(
        { data: { address: user.address } },
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
   * Get or create user by address
   */
  static async getOrCreateUser(address: string): Promise<User> {
    try {
      let user = await prisma.user.findUnique({
        where: { address: address.toLowerCase() }
      });

      if (!user) {
        user = await prisma.user.create({
          data: {
            address: address.toLowerCase(),
          }
        });
      }

      return user;
    } catch (error) {
      logger.error('Error getting or creating user:', error);
      throw error;
    }
  }

  /**
   * Verify JWT token
   */
  static verifyToken(token: string): { address: string } | null {
    try {
      const decoded = jwt.verify(token, this.JWT_SECRET) as { address: string };
      return decoded;
    } catch (error) {
      logger.error('Error verifying token:', error);
      return null;
    }
  }
} 