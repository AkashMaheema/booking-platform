import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { IsPassword } from '../../../common/validators/is-password.validator';

export class RegisterDto {
  @ApiProperty({
    example: 'John Doe',
    description: 'The full name of the user',
  })
  @IsString()
  @Transform(({ value }: { value: any }) => typeof value === 'string' ? value.trim() : value)
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  name!: string;

  @ApiProperty({
    example: 'user@example.com',
    description: 'A valid and unique email address',
  })
  @IsEmail()
  @Transform(({ value }: { value: any }) => typeof value === 'string' ? value.trim().toLowerCase() : value)
  @IsNotEmpty()
  email!: string;

  @ApiProperty({
    example: 'StrongP@ssw0rd!',
    description:
      'Password must be 8-64 characters and contain uppercase, lowercase, numbers, and special characters',
  })
  @IsString()
  @IsNotEmpty()
  @IsPassword()
  password!: string;
}
