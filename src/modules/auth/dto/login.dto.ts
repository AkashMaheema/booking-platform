import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class LoginDto {
  @ApiProperty({
    example: 'user@example.com',
  })
  @IsEmail()
  @Transform(({ value }: { value: any }) => typeof value === 'string' ? value.trim().toLowerCase() : value)
  @IsNotEmpty()
  email!: string;

  @ApiProperty({
    example: 'StrongP@ssw0rd!',
  })
  @IsString()
  @IsNotEmpty()
  password!: string;
}
