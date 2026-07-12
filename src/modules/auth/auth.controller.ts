import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiUnprocessableEntityResponse,
  ApiOkResponse,
  ApiCreatedResponse,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '@prisma/client';
import { ErrorResponseDto } from '../../common/dto/error-response.dto';

/**
 * Auth endpoints.
 *
 * Login, register and refresh use a strict rate limit (5 req / 60 s) to
 * mitigate brute-force and credential-stuffing attacks. All other auth routes
 * fall back to the global throttle default (100 req / 60 s).
 */
@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @ApiOperation({ summary: 'Register a new user' })
  @ApiCreatedResponse({
    description: 'User registered successfully.',
    schema: {
      example: {
        success: true,
        message: 'User registered successfully.',
        data: {
          id: 'uuid-1234',
          email: 'user@example.com',
        },
      },
    },
  })
  @ApiConflictResponse({ description: 'User already exists.', type: ErrorResponseDto })
  @ApiUnprocessableEntityResponse({ description: 'Validation failed.', type: ErrorResponseDto })
  @ApiBadRequestResponse({ description: 'Bad Request.', type: ErrorResponseDto })
  async register(
    @Body() registerDto: RegisterDto,
  ): Promise<{ success: boolean; message: string; data: { id: string; email: string } }> {
    const user = await this.authService.register(registerDto);
    return {
      success: true,
      message: 'User registered successfully.',
      data: {
        id: user.id,
        email: user.email,
      },
    };
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @ApiOperation({ summary: 'Login and receive access & refresh tokens' })
  @ApiOkResponse({
    description: 'Login successful.',
    schema: {
      example: {
        success: true,
        message: 'Login successful.',
        data: {
          accessToken: 'eyJhbGciOiJIUzI1...',
          refreshToken: 'eyJhbGciOiJIUzI1...',
        },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Invalid email or password.', type: ErrorResponseDto })
  @ApiBadRequestResponse({ description: 'Bad Request.', type: ErrorResponseDto })
  async login(@Body() loginDto: LoginDto): Promise<{
    success: boolean;
    message: string;
    data: { accessToken: string; refreshToken: string };
  }> {
    const tokens = await this.authService.login(loginDto);
    return {
      success: true,
      message: 'Login successful.',
      data: tokens,
    };
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard('jwt-refresh'))
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @ApiOperation({ summary: 'Refresh access token using a valid refresh token' })
  @ApiOkResponse({
    description: 'Token refreshed successfully.',
    schema: {
      example: {
        success: true,
        message: 'Token refreshed successfully.',
        data: {
          accessToken: 'eyJhbGciOiJIUzI1...',
          refreshToken: 'eyJhbGciOiJIUzI1...',
        },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or expired refresh token.',
    type: ErrorResponseDto,
  })
  async refresh(
    @Body() refreshDto: RefreshDto,
    @CurrentUser() user: { sub: string; email: string; role: string },
  ): Promise<{
    success: boolean;
    message: string;
    data: { accessToken: string; refreshToken: string };
  }> {
    // The RefreshStrategy validates the token signature and attaches the payload & raw token to request.user
    const tokens = await this.authService.refreshTokens(user.sub, refreshDto.refreshToken);
    return {
      success: true,
      message: 'Token refreshed successfully.',
      data: tokens,
    };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Logout and invalidate all refresh tokens' })
  @ApiOkResponse({
    description: 'Logged out successfully.',
    schema: {
      example: {
        success: true,
        message: 'Logged out successfully.',
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized.', type: ErrorResponseDto })
  async logout(@CurrentUser() user: User): Promise<{ success: boolean; message: string }> {
    await this.authService.logout(user.id);
    return {
      success: true,
      message: 'Logged out successfully.',
    };
  }
}
