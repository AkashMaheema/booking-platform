import {
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthRepository } from './auth.repository';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { User } from '@prisma/client';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly authRepository: AuthRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Registers a new user. Hashes password and ensures email is unique.
   */
  async register(registerDto: RegisterDto): Promise<Omit<User, 'password'>> {
    // Duplicate Email Prevention is handled at the Database/Prisma Exception level
    // (P2002 -> 409 Conflict) thanks to the PrismaExceptionFilter.
    // However, the prompt specifically says: "Before creating a user: Check email. If already exists Return 409 Conflict Message: User already exists."
    const existingUser = await this.authRepository.findUserByEmail(
      registerDto.email,
    );

    if (existingUser) {
      throw new ConflictException('User already exists.');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 12);

    const user = await this.authRepository.createUser({
      name: registerDto.name,
      email: registerDto.email,
      password: hashedPassword,
      role: 'STAFF', // Default role per design
    });

    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * Authenticates a user and returns Access/Refresh tokens.
   */
  async login(
    loginDto: LoginDto,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const user = await this.authRepository.findUserByEmail(loginDto.email);

    if (!user) {
      // Never indicate if email exists or password incorrect.
      throw new UnauthorizedException('Invalid email or password.');
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('User account is inactive.');
    }

    return this.generateTokens(user);
  }

  /**
   * Generates a new access/refresh token pair and rotates the refresh token.
   */
  async refreshTokens(
    userId: string,
    rawRefreshToken: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const hashedTokenString = this.hashToken(rawRefreshToken);

    const existingToken =
      await this.authRepository.findRefreshToken(hashedTokenString);

    if (!existingToken || existingToken.isRevoked) {
      this.logger.warn(`Attempt to use invalid/revoked refresh token for user ${userId}`);
      throw new UnauthorizedException('Invalid refresh token.');
    }

    if (existingToken.userId !== userId) {
      throw new UnauthorizedException('Invalid refresh token.');
    }

    if (new Date() > existingToken.expiresAt) {
      await this.authRepository.deleteRefreshToken(hashedTokenString);
      throw new UnauthorizedException('Refresh token has expired.');
    }

    const user = await this.authRepository.findUserById(userId);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('User is inactive or does not exist.');
    }

    // Refresh Token Rotation: Delete old token, generate new ones
    await this.authRepository.deleteRefreshToken(hashedTokenString);

    return this.generateTokens(user);
  }

  /**
   * Revokes all active refresh tokens for the given user.
   */
  async logout(userId: string): Promise<void> {
    await this.authRepository.revokeAllUserRefreshTokens(userId);
  }

  /**
   * Internal helper to generate and store tokens.
   */
  private async generateTokens(
    user: User,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload);

    const refreshSecret = this.configService.get<string>('REFRESH_SECRET');
    const refreshExpiresIn =
      this.configService.get<string>('REFRESH_EXPIRES_IN') || '7d';

    const rawRefreshToken = this.jwtService.sign(payload, {
      secret: refreshSecret,
      expiresIn: refreshExpiresIn as any,
    });

    const hashedRefreshToken = this.hashToken(rawRefreshToken);
    const decodedRefresh = this.jwtService.decode(rawRefreshToken) as any;
    const expiresAt = new Date(decodedRefresh.exp * 1000);

    await this.authRepository.saveRefreshToken(
      user.id,
      hashedRefreshToken,
      expiresAt,
    );

    return {
      accessToken,
      refreshToken: rawRefreshToken,
    };
  }

  /**
   * Securely hashes a token (e.g. Refresh Token) using SHA-256 for fast/secure DB lookup.
   */
  private hashToken(token: string): string {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}
