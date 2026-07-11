import { ApiProperty } from '@nestjs/swagger';
import { User, Role } from '@prisma/client';

export class UserResponseDto {
  @ApiProperty({ example: 'uuid-1234', description: 'The unique identifier of the user' })
  id!: string;
  @ApiProperty({ example: 'John Doe', description: 'The full name of the user' })
  name!: string;
  @ApiProperty({ example: 'user@example.com', description: 'The email address' })
  email!: string;
  @ApiProperty({ enum: Role, example: Role.STAFF, description: 'The user role (ADMIN or STAFF)' })
  role!: Role;
  @ApiProperty({ example: true, description: 'Whether the user account is active' })
  isActive!: boolean;
  @ApiProperty({ example: '2026-07-11T12:00:00Z', description: 'Timestamp when user was created' })
  createdAt!: Date;

  constructor(partial: Partial<User>) {
    this.id = partial.id!;
    this.name = partial.name!;
    this.email = partial.email!;
    this.role = partial.role!;
    this.isActive = partial.isActive!;
    this.createdAt = partial.createdAt!;
  }
}
