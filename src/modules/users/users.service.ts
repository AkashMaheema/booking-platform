import { Injectable, Logger, NotFoundException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UsersRepository } from './users.repository';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UserQueryDto } from './dto/user-query.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { User } from '@prisma/client';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly usersRepository: UsersRepository) {}

  async getProfile(userId: string): Promise<UserResponseDto> {
    const user = await this.usersRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return new UserResponseDto(user);
  }

  async updateProfile(userId: string, updateDto: UpdateUserDto): Promise<UserResponseDto> {
    const user = await this.usersRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Since DTO restricts modification to 'name', we can just pass it
    const updatedUser = await this.usersRepository.update(userId, updateDto);
    this.logger.log(`User ${userId} updated their profile`);
    return new UserResponseDto(updatedUser);
  }

  async changePassword(userId: string, dto: ChangePasswordDto): Promise<void> {
    if (dto.newPassword !== dto.confirmPassword) {
      throw new BadRequestException('New password and confirm password do not match');
    }

    const user = await this.usersRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isPasswordValid = await bcrypt.compare(dto.currentPassword, user.password);
    if (!isPasswordValid) {
      this.logger.warn(`Failed password change attempt for user ${userId}`);
      throw new UnauthorizedException('Invalid current password');
    }

    const isReused = await bcrypt.compare(dto.newPassword, user.password);
    if (isReused) {
      throw new BadRequestException('Cannot reuse the current password');
    }

    const hashedNewPassword = await bcrypt.hash(dto.newPassword, 12);

    await this.usersRepository.changePassword(userId, hashedNewPassword);
    
    // Invalidate refresh tokens requiring re-login
    await this.usersRepository.deleteRefreshTokens(userId);
    
    this.logger.log(`User ${userId} changed their password and refresh tokens were revoked`);
  }

  async findUser(id: string): Promise<UserResponseDto> {
    const user = await this.usersRepository.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return new UserResponseDto(user);
  }

  async findUsers(query: UserQueryDto): Promise<{ data: UserResponseDto[]; meta: { total: number; page: number; limit: number } }> {
    const { data, total } = await this.usersRepository.findAll(query);
    
    return {
      data: data.map((user) => new UserResponseDto(user)),
      meta: {
        total,
        page: query.page || 1,
        limit: query.limit || 10,
      },
    };
  }

  async deactivateUser(id: string): Promise<UserResponseDto> {
    const user = await this.usersRepository.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updatedUser = await this.usersRepository.deactivate(id);
    this.logger.log(`Admin deactivated user ${id}`);
    return new UserResponseDto(updatedUser);
  }

  async activateUser(id: string): Promise<UserResponseDto> {
    const user = await this.usersRepository.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updatedUser = await this.usersRepository.activate(id);
    this.logger.log(`Admin activated user ${id}`);
    return new UserResponseDto(updatedUser);
  }
}
