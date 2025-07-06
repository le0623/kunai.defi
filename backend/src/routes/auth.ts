import { NextFunction, Request, Response, Router } from 'express';
import { body, validationResult } from 'express-validator';
import { authenticateToken } from '@/middleware/auth';
import { AuthController } from '@/controllers/authController';

const router: Router = Router();

// Generate nonce for SIWE authentication
router.get('/nonce', AuthController.generateNonce);

// Verify SIWE signature and authenticate
router.post('/verify', 
  [
    body('message').isString().notEmpty().withMessage('Message is required'),
    body('signature').isString().notEmpty().withMessage('Signature is required')
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        message: 'Invalid request data',
        errors: errors.array(),
      });
    }
    next();
  },
  AuthController.verifySignature
);

// Get current user information
router.get('/me', authenticateToken, AuthController.getCurrentUser);

// Logout user
router.post('/logout', authenticateToken, AuthController.logout);

export default router; 