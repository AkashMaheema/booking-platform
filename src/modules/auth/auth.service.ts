import { ConflictException, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { createHash } from 'crypto';
import { AuthRepository } from './auth.repository';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuditService, AuditAction } from '../../common/logging/audit.service';
import { User } from '@prisma/client';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly authRepository: AuthRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Registers a new user. Hashes password and ensures email is unique.
   */
  async register(registerDto: RegisterDto): Promise<Omit<User, 'password'>> {
    const existingUser = await this.authRepository.findUserByEmail(registerDto.email);

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

    this.auditService.log({
      action: AuditAction.USER_REGISTERED,
      resource: 'User',
      resourceId: user.id,
      details: { email: user.email },
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * Authenticates a user and returns Access/Refresh tokens.
   */
  async login(loginDto: LoginDto): Promise<{ accessToken: string; refreshToken: string }> {
    const user = await this.authRepository.findUserByEmail(loginDto.email);

    if (!user) {
      // Never indicate if email exists or password incorrect.
      throw new UnauthorizedException('Invalid email or password.');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('User account is inactive.');
    }

    this.auditService.log({
      action: AuditAction.USER_LOGGED_IN,
      resource: 'User',
      resourceId: user.id,
      details: { email: user.email },
    });

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

    const existingToken = await this.authRepository.findRefreshToken(hashedTokenString);

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
    if (!user?.isActive) {
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
  private async generateTokens(user: User): Promise<{ accessToken: string; refreshToken: string }> {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload);

    const refreshSecret = this.configService.get<string>('REFRESH_SECRET');
    const refreshExpiresIn = this.configService.get<string>('REFRESH_EXPIRES_IN') ?? '7d';

    const rawRefreshToken = this.jwtService.sign(payload, {
      secret: refreshSecret,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
      expiresIn: refreshExpiresIn as any,
    });

    const hashedRefreshToken = this.hashToken(rawRefreshToken);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const decodedRefresh = this.jwtService.decode(rawRefreshToken);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const expiresAt = new Date(decodedRefresh.exp * 1000);

    await this.authRepository.saveRefreshToken(user.id, hashedRefreshToken, expiresAt);

    return {
      accessToken,
      refreshToken: rawRefreshToken,
    };
  }

  /**
   * Securely hashes a token (e.g. Refresh Token) using SHA-256 for fast/secure DB lookup.
   * This is intentionally NOT bcrypt — refresh tokens are already random/high-entropy JWTs,
   * so a fast cryptographic hash is sufficient and avoids unnecessary bcrypt overhead.
   */
  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
