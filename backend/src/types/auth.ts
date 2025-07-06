import { Request } from 'express';

export type Payload = {
  address: string;
}

export type Token = {
  success: boolean;
  user: Payload;
  token: string;
}

export interface AuthRequest {
  message: string;
  signature: `0x${string}`;
}

export interface AuthenticatedRequest extends Request {
  user?: {
    address: string;
  };
}