import { Request, Response } from 'express';
import { register } from '../auth.controller';
import { prismaMock } from '../../../__mocks__/prisma';
import bcrypt from 'bcrypt';
import * as jwtUtils from '../../../utils/jwt';

jest.mock('bcrypt');
jest.mock('../../../utils/jwt');

describe('Auth Controller', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: jest.Mock;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;
  let cookieMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    cookieMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    mockReq = {
      body: { name: 'Test', email: 'test@test.com', password: 'password123' }
    };
    mockRes = {
      status: statusMock,
      json: jsonMock,
      cookie: cookieMock,
    };
    mockNext = jest.fn();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null); // No existing user
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
      prismaMock.user.create.mockResolvedValue({ id: '1', name: 'Test', email: 'test@test.com', passwordHash: 'hashedPassword', bio: null, createdAt: new Date(), updatedAt: new Date() });
      
      (jwtUtils.generateAccessToken as jest.Mock).mockReturnValue('access_token');
      (jwtUtils.generateRefreshToken as jest.Mock).mockReturnValue('refresh_token');

      prismaMock.refreshToken.create.mockResolvedValue({ id: '1', tokenHash: 'hash', userId: '1', revoked: false, expiresAt: new Date(), createdAt: new Date() });

      await register(mockReq as Request, mockRes as Response, mockNext);

      expect(prismaMock.user.create).toHaveBeenCalledWith({
        data: { name: 'Test', email: 'test@test.com', passwordHash: 'hashedPassword' }
      });
      expect(cookieMock).toHaveBeenCalledWith('refreshToken', 'refresh_token', expect.any(Object));
      
      const responseData = statusMock.mock.calls[0] ? jsonMock.mock.calls[0][0] : jsonMock.mock.calls[0][0];
      expect(responseData.success).toBe(true);
      expect(responseData.data.accessToken).toBe('access_token');
    });

    it('should return error if email exists', async () => {
      prismaMock.user.findUnique.mockResolvedValue({ id: '1', name: 'Test', email: 'test@test.com', passwordHash: 'oldHash', bio: null, createdAt: new Date(), updatedAt: new Date() });

      await register(mockReq as Request, mockRes as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({ success: false, message: 'Email already in use' }));
    });
  });
});
