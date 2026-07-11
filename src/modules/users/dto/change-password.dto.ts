import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength, MinLength, Matches, ValidateIf } from 'class-validator';

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
  @MinLength(8)
  @MaxLength(64)
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message:
      'password must contain uppercase, lowercase, number and special character, and must not contain spaces',
  })
  newPassword!: string;

  @ApiProperty({
    example: 'NewP@ssw0rd!',
    description: 'Must match the newPassword',
  })
  @IsString()
  @IsNotEmpty()
  confirmPassword!: string;
}
