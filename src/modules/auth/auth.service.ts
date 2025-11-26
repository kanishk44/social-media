import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../../config/database';
import { env } from '../../config/env';
import { HttpError } from '../../middleware/error-handler';
import { UserDTO } from '../../models/types';
import { AuthPayload } from '../../middleware/auth';

const SALT_ROUNDS = 12;

export class AuthService {
  async register(data: {
    email: string;
    handle: string;
    name: string;
    password: string;
  }): Promise<{ user: UserDTO; accessToken: string }> {
    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email: data.email }, { handle: data.handle }],
      },
    });

    if (existingUser) {
      throw new HttpError(
        409,
        existingUser.email === data.email
          ? 'Email already registered'
          : 'Handle already taken',
        'USER_EXISTS'
      );
    }

    // Hash password
    const passwordHash = await this.hashPassword(data.password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: data.email,
        handle: data.handle,
        name: data.name,
        passwordHash,
      },
    });

    // Generate token
    const accessToken = this.generateToken({
      userId: user.id,
      handle: user.handle,
    });

    return {
      user: this.toUserDTO(user),
      accessToken,
    };
  }

  async login(credentials: {
    emailOrHandle: string;
    password: string;
  }): Promise<{ user: UserDTO; accessToken: string }> {
    // Find user by email or handle
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: credentials.emailOrHandle }, { handle: credentials.emailOrHandle }],
      },
    });

    if (!user) {
      throw new HttpError(401, 'Invalid credentials', 'INVALID_CREDENTIALS');
    }

    // Verify password
    const isValidPassword = await this.verifyPassword(credentials.password, user.passwordHash);

    if (!isValidPassword) {
      throw new HttpError(401, 'Invalid credentials', 'INVALID_CREDENTIALS');
    }

    // Generate token
    const accessToken = this.generateToken({
      userId: user.id,
      handle: user.handle,
    });

    return {
      user: this.toUserDTO(user),
      accessToken,
    };
  }

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  generateToken(payload: AuthPayload): string {
    return jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: env.JWT_TTL,
    } as jwt.SignOptions);
  }

  private toUserDTO(user: {
    id: string;
    email: string;
    handle: string;
    name: string;
    createdAt: Date;
  }): UserDTO {
    return {
      id: user.id,
      email: user.email,
      handle: user.handle,
      name: user.name,
      createdAt: user.createdAt,
    };
  }
}

export const authService = new AuthService();

