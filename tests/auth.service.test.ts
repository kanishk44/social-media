import { AuthService } from '../src/modules/auth/auth.service';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { env } from '../src/config/env';

// Mock dependencies
jest.mock('../src/config/database', () => ({
  prisma: {
    user: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  },
}));

jest.mock('bcrypt');
jest.mock('jsonwebtoken');

import { prisma } from '../src/config/database';

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService();
    jest.clearAllMocks();
  });

  describe('hashPassword', () => {
    it('should hash a password', async () => {
      const password = 'password123';
      const hashedPassword = 'hashedpassword';

      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);

      const result = await authService.hashPassword(password);

      expect(bcrypt.hash).toHaveBeenCalledWith(password, 12);
      expect(result).toBe(hashedPassword);
    });
  });

  describe('verifyPassword', () => {
    it('should verify a correct password', async () => {
      const password = 'password123';
      const hash = 'hashedpassword';

      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await authService.verifyPassword(password, hash);

      expect(bcrypt.compare).toHaveBeenCalledWith(password, hash);
      expect(result).toBe(true);
    });

    it('should reject an incorrect password', async () => {
      const password = 'wrongpassword';
      const hash = 'hashedpassword';

      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await authService.verifyPassword(password, hash);

      expect(bcrypt.compare).toHaveBeenCalledWith(password, hash);
      expect(result).toBe(false);
    });
  });

  describe('generateToken', () => {
    it('should generate a JWT token', () => {
      const payload = { userId: 'user123', handle: 'testuser' };
      const token = 'generatedtoken';

      (jwt.sign as jest.Mock).mockReturnValue(token);

      const result = authService.generateToken(payload);

      expect(jwt.sign).toHaveBeenCalledWith(payload, env.JWT_SECRET, {
        expiresIn: env.JWT_TTL,
      });
      expect(result).toBe(token);
    });
  });

  describe('register', () => {
    it('should register a new user', async () => {
      const userData = {
        email: 'test@example.com',
        handle: 'testuser',
        name: 'Test User',
        password: 'password123',
      };

      const hashedPassword = 'hashedpassword';
      const createdUser = {
        id: 'user123',
        email: userData.email,
        handle: userData.handle,
        name: userData.name,
        passwordHash: hashedPassword,
        createdAt: new Date(),
      };
      const token = 'generatedtoken';

      (prisma.user.findFirst as jest.Mock).mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
      (prisma.user.create as jest.Mock).mockResolvedValue(createdUser);
      (jwt.sign as jest.Mock).mockReturnValue(token);

      const result = await authService.register(userData);

      expect(prisma.user.findFirst).toHaveBeenCalledWith({
        where: {
          OR: [{ email: userData.email }, { handle: userData.handle }],
        },
      });
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          email: userData.email,
          handle: userData.handle,
          name: userData.name,
          passwordHash: hashedPassword,
        },
      });
      expect(result.user.id).toBe(createdUser.id);
      expect(result.accessToken).toBe(token);
    });

    it('should throw error if email already exists', async () => {
      const userData = {
        email: 'existing@example.com',
        handle: 'testuser',
        name: 'Test User',
        password: 'password123',
      };

      const existingUser = {
        id: 'user123',
        email: userData.email,
        handle: 'otherhandle',
        passwordHash: 'hash',
        name: 'Existing User',
        createdAt: new Date(),
      };

      (prisma.user.findFirst as jest.Mock).mockResolvedValue(existingUser);

      await expect(authService.register(userData)).rejects.toThrow('Email already registered');
    });

    it('should throw error if handle already exists', async () => {
      const userData = {
        email: 'test@example.com',
        handle: 'existinghandle',
        name: 'Test User',
        password: 'password123',
      };

      const existingUser = {
        id: 'user123',
        email: 'other@example.com',
        handle: userData.handle,
        passwordHash: 'hash',
        name: 'Existing User',
        createdAt: new Date(),
      };

      (prisma.user.findFirst as jest.Mock).mockResolvedValue(existingUser);

      await expect(authService.register(userData)).rejects.toThrow('Handle already taken');
    });
  });

  describe('login', () => {
    it('should login with valid credentials', async () => {
      const credentials = {
        emailOrHandle: 'test@example.com',
        password: 'password123',
      };

      const user = {
        id: 'user123',
        email: 'test@example.com',
        handle: 'testuser',
        name: 'Test User',
        passwordHash: 'hashedpassword',
        createdAt: new Date(),
      };
      const token = 'generatedtoken';

      (prisma.user.findFirst as jest.Mock).mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (jwt.sign as jest.Mock).mockReturnValue(token);

      const result = await authService.login(credentials);

      expect(prisma.user.findFirst).toHaveBeenCalledWith({
        where: {
          OR: [{ email: credentials.emailOrHandle }, { handle: credentials.emailOrHandle }],
        },
      });
      expect(bcrypt.compare).toHaveBeenCalledWith(credentials.password, user.passwordHash);
      expect(result.user.id).toBe(user.id);
      expect(result.accessToken).toBe(token);
    });

    it('should throw error if user not found', async () => {
      const credentials = {
        emailOrHandle: 'nonexistent@example.com',
        password: 'password123',
      };

      (prisma.user.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(authService.login(credentials)).rejects.toThrow('Invalid credentials');
    });

    it('should throw error if password is incorrect', async () => {
      const credentials = {
        emailOrHandle: 'test@example.com',
        password: 'wrongpassword',
      };

      const user = {
        id: 'user123',
        email: 'test@example.com',
        handle: 'testuser',
        name: 'Test User',
        passwordHash: 'hashedpassword',
        createdAt: new Date(),
      };

      (prisma.user.findFirst as jest.Mock).mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(authService.login(credentials)).rejects.toThrow('Invalid credentials');
    });
  });
});

