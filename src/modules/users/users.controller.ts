import { Body, Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
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
  @ApiResponse({ status: 200, description: 'Profile retrieved successfully.' })
  async getProfile(@CurrentUser() user: User) {
    const profile = await this.usersService.getProfile(user.id);
    return {
      success: true,
      data: profile,
    };
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully.' })
  async updateProfile(@CurrentUser() user: User, @Body() updateDto: UpdateUserDto) {
    const updatedProfile = await this.usersService.updateProfile(user.id, updateDto);
    return {
      success: true,
      data: updatedProfile,
    };
  }

  @Patch('change-password')
  @ApiOperation({ summary: 'Change current user password' })
  @ApiResponse({ status: 200, description: 'Password changed successfully. Refresh tokens revoked.' })
  @ApiResponse({ status: 400, description: 'Passwords do not match or reusing old password.' })
  @ApiResponse({ status: 401, description: 'Invalid current password.' })
  async changePassword(@CurrentUser() user: User, @Body() changePasswordDto: ChangePasswordDto) {
    await this.usersService.changePassword(user.id, changePasswordDto);
    return {
      success: true,
      message: 'Password changed successfully',
    };
  }

  @Get()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Retrieve paginated users list (ADMIN only)' })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully.' })
  @ApiResponse({ status: 403, description: 'Forbidden. Admin role required.' })
  async findUsers(@Query() query: UserQueryDto) {
    const result = await this.usersService.findUsers(query);
    return {
      success: true,
      ...result,
    };
  }

  @Get(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Retrieve user by ID (ADMIN only)' })
  @ApiResponse({ status: 200, description: 'User retrieved successfully.' })
  @ApiResponse({ status: 403, description: 'Forbidden. Admin role required.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  async findUser(@Param('id') id: string) {
    const user = await this.usersService.findUser(id);
    return {
      success: true,
      data: user,
    };
  }

  @Patch(':id/deactivate')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Deactivate a user (ADMIN only)' })
  @ApiResponse({ status: 200, description: 'User deactivated successfully.' })
  async deactivateUser(@Param('id') id: string) {
    const user = await this.usersService.deactivateUser(id);
    return {
      success: true,
      data: user,
    };
  }

  @Patch(':id/activate')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Activate a user (ADMIN only)' })
  @ApiResponse({ status: 200, description: 'User activated successfully.' })
  async activateUser(@Param('id') id: string) {
    const user = await this.usersService.activateUser(id);
    return {
      success: true,
      data: user,
    };
  }
}
