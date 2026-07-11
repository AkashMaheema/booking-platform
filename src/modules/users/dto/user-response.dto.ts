import { User, Role } from '@prisma/client';

export class UserResponseDto {
  id!: string;
  name!: string;
  email!: string;
  role!: Role;
  isActive!: boolean;
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
