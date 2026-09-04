import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import prisma from '../../utils/prisma';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../../utils/jwt';
import { sendSuccess, sendError } from '../../utils/response';
import { z } from 'zod';

const registerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  avatar: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

// Helper to hash token for DB storage
const hashToken = (token: string) => crypto.createHash('sha256').update(token).digest('hex');

const setRefreshCookie = (res: Response, token: string) => {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = registerSchema.parse(req.body);
    
    const existing = await prisma.user.findUnique({ where: { email: validated.email } });
    if (existing) {
      return sendError(res, 400, 'Email already in use');
    }

    const passwordHash = await bcrypt.hash(validated.password, 10);
    const user = await prisma.user.create({
      data: { name: validated.name, email: validated.email, passwordHash, avatar: validated.avatar },
    });

    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(refreshToken),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    setRefreshCookie(res, refreshToken);

    return sendSuccess(res, { 
      accessToken,
      user: { id: user.id, name: user.name, email: user.email, avatar: user.avatar }
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return sendError(res, 400, 'Validation Error', err.errors);
    }
    next(err);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = loginSchema.parse(req.body);
    
    const user = await prisma.user.findUnique({ where: { email: validated.email } });
    if (!user) {
      return sendError(res, 401, 'Invalid credentials');
    }

    const validPassword = await bcrypt.compare(validated.password, user.passwordHash);
    if (!validPassword) {
      return sendError(res, 401, 'Invalid credentials');
    }

    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(refreshToken),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    setRefreshCookie(res, refreshToken);

    return sendSuccess(res, { 
      accessToken,
      user: { id: user.id, name: user.name, email: user.email, avatar: user.avatar }
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return sendError(res, 400, 'Validation Error', err.errors);
    }
    next(err);
  }
};

export const refresh = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.cookies;
    if (!refreshToken) {
      return sendError(res, 401, 'No refresh token provided');
    }

    const decoded = verifyRefreshToken(refreshToken);
    const tokenHash = hashToken(refreshToken);

    const storedToken = await prisma.refreshToken.findFirst({
      where: { tokenHash, revoked: false, userId: decoded.userId },
    });

    if (!storedToken || storedToken.expiresAt < new Date()) {
      return sendError(res, 401, 'Invalid or expired refresh token');
    }

    // Revoke old token
    await prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revoked: true },
    });

    // Issue new tokens
    const newAccessToken = generateAccessToken(decoded.userId);
    const newRefreshToken = generateRefreshToken(decoded.userId);

    await prisma.refreshToken.create({
      data: {
        userId: decoded.userId,
        tokenHash: hashToken(newRefreshToken),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    setRefreshCookie(res, newRefreshToken);

    return sendSuccess(res, { accessToken: newAccessToken });
  } catch (err: any) {
    return sendError(res, 401, 'Invalid refresh token');
  }
};

export const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.cookies;
    if (refreshToken) {
      const tokenHash = hashToken(refreshToken);
      await prisma.refreshToken.updateMany({
        where: { tokenHash },
        data: { revoked: true },
      });
    }

    res.clearCookie('refreshToken');
    return sendSuccess(res, null, 'Logged out successfully');
  } catch (err) {
    next(err);
  }
};
