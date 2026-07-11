import { Injectable } from '@nestjs/common';
import { Prisma, RefreshToken, User } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

/**
 * Repository for Authentication related database operations.
 * Isolates Prisma from the AuthService.
 */
@Injectable()
export class AuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createUser(data: Prisma.UserCreateInput): Promise<User> {
    // Normalizes email to lowercase at the repository boundary
    return this.prisma.user.create({
      data: {
        ...data,
        email: data.email.toLowerCase().trim(),
      },
    });
  }

  async findUserByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });
  }

  async findUserById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async saveRefreshToken(
    userId: string,
    hashedToken: string,
    expiresAt: Date,
  ): Promise<RefreshToken> {
    return this.prisma.refreshToken.create({
      data: {
        userId,
        token: hashedToken,
        expiresAt,
      },
    });
  }

  async deleteRefreshToken(tokenHash: string): Promise<void> {
    await this.prisma.refreshToken.delete({
      where: { token: tokenHash },
    });
  }

  async revokeAllUserRefreshTokens(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, isRevoked: false },
      data: { isRevoked: true },
    });
  }

  async findRefreshToken(tokenHash: string): Promise<RefreshToken | null> {
    return this.prisma.refreshToken.findUnique({
      where: { token: tokenHash },
    });
  }
}
