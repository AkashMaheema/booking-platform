import { Body, Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiOkResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import { ErrorResponseDto } from '../../common/dto/error-response.dto';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UserQueryDto } from './dto/user-query.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role, User } from '@prisma/client';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiOkResponse({
    description: 'Profile retrieved successfully.',
    schema: {
      example: {
        success: true,
        data: {
          id: 'uuid-1234',
          email: 'user@example.com',
          name: 'John Doe',
          role: 'STAFF',
          isActive: true,
        },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized.', type: ErrorResponseDto })
  async getProfile(@CurrentUser() user: User): Promise<{ success: boolean; data: unknown }> {
    const profile = await this.usersService.getProfile(user.id);
    return {
      success: true,
      data: profile,
    };
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiOkResponse({
    description: 'Profile updated successfully.',
    schema: {
      example: {
        success: true,
        data: {
          id: 'uuid-1234',
          email: 'user@example.com',
          name: 'John Doe Updated',
          role: 'STAFF',
          isActive: true,
        },
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Validation failed.', type: ErrorResponseDto })
  @ApiUnauthorizedResponse({ description: 'Unauthorized.', type: ErrorResponseDto })
  async updateProfile(
    @CurrentUser() user: User,
    @Body() updateDto: UpdateUserDto,
  ): Promise<{ success: boolean; data: unknown }> {
    const updatedProfile = await this.usersService.updateProfile(user.id, updateDto);
    return {
      success: true,
      data: updatedProfile,
    };
  }

  @Patch('change-password')
  @ApiOperation({ summary: 'Change current user password' })
  @ApiOkResponse({
    description: 'Password changed successfully. Refresh tokens revoked.',
    schema: {
      example: {
        success: true,
        message: 'Password changed successfully',
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Passwords do not match or reusing old password.',
    type: ErrorResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Invalid current password.', type: ErrorResponseDto })
  async changePassword(
    @CurrentUser() user: User,
    @Body() changePasswordDto: ChangePasswordDto,
  ): Promise<{ success: boolean; message: string }> {
    await this.usersService.changePassword(user.id, changePasswordDto);
    return {
      success: true,
      message: 'Password changed successfully',
    };
  }

  @Get()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Retrieve paginated users list (ADMIN only)' })
  @ApiOkResponse({
    description: 'Users retrieved successfully.',
    schema: {
      example: {
        success: true,
        data: [
          {
            id: 'uuid-1234',
            email: 'user@example.com',
            name: 'John Doe',
            role: 'STAFF',
            isActive: true,
          },
        ],
        meta: {
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      },
    },
  })
  @ApiForbiddenResponse({ description: 'Forbidden. Admin role required.', type: ErrorResponseDto })
  @ApiUnauthorizedResponse({ description: 'Unauthorized.', type: ErrorResponseDto })
  async findUsers(
    @Query() query: UserQueryDto,
  ): Promise<{ success: boolean; data: unknown[]; meta: unknown }> {
    const result = await this.usersService.findUsers(query);
    return {
      success: true,
      ...result,
    };
  }

  @Get(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Retrieve user by ID (ADMIN only)' })
  @ApiOkResponse({
    description: 'User retrieved successfully.',
    schema: {
      example: {
        success: true,
        data: {
          id: 'uuid-1234',
          email: 'user@example.com',
          name: 'John Doe',
          role: 'STAFF',
          isActive: true,
        },
      },
    },
  })
  @ApiForbiddenResponse({ description: 'Forbidden. Admin role required.', type: ErrorResponseDto })
  @ApiNotFoundResponse({ description: 'User not found.', type: ErrorResponseDto })
  @ApiUnauthorizedResponse({ description: 'Unauthorized.', type: ErrorResponseDto })
  async findUser(@Param('id') id: string): Promise<{ success: boolean; data: unknown }> {
    const user = await this.usersService.findUser(id);
    return {
      success: true,
      data: user,
    };
  }

  @Patch(':id/deactivate')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Deactivate a user (ADMIN only)' })
  @ApiOkResponse({
    description: 'User deactivated successfully.',
    schema: {
      example: {
        success: true,
        data: {
          id: 'uuid-1234',
          isActive: false,
        },
      },
    },
  })
  @ApiForbiddenResponse({ description: 'Forbidden. Admin role required.', type: ErrorResponseDto })
  @ApiNotFoundResponse({ description: 'User not found.', type: ErrorResponseDto })
  @ApiUnauthorizedResponse({ description: 'Unauthorized.', type: ErrorResponseDto })
  async deactivateUser(@Param('id') id: string): Promise<{ success: boolean; data: unknown }> {
    const user = await this.usersService.deactivateUser(id);
    return {
      success: true,
      data: user,
    };
  }

  @Patch(':id/activate')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Activate a user (ADMIN only)' })
  @ApiOkResponse({
    description: 'User activated successfully.',
    schema: {
      example: {
        success: true,
        data: {
          id: 'uuid-1234',
          isActive: true,
        },
      },
    },
  })
  @ApiForbiddenResponse({ description: 'Forbidden. Admin role required.', type: ErrorResponseDto })
  @ApiNotFoundResponse({ description: 'User not found.', type: ErrorResponseDto })
  @ApiUnauthorizedResponse({ description: 'Unauthorized.', type: ErrorResponseDto })
  async activateUser(@Param('id') id: string): Promise<{ success: boolean; data: unknown }> {
    const user = await this.usersService.activateUser(id);
    return {
      success: true,
      data: user,
    };
  }
}
