import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';
import { IsPassword } from '../../../common/validators/is-password.validator';

export class ChangePasswordDto {
  @ApiProperty({
    example: 'OldP@ssw0rd!',
    description: 'The current password of the user',
  })
  @IsString()
  @IsNotEmpty()
  currentPassword!: string;

  @ApiProperty({
    example: 'NewP@ssw0rd!',
    description: 'The new strong password',
  })
  @IsString()
  @IsNotEmpty()
  @IsPassword()
  newPassword!: string;

  @ApiProperty({
    example: 'NewP@ssw0rd!',
    description: 'Must match the newPassword',
  })
  @IsString()
  @IsNotEmpty()
  confirmPassword!: string;
}
