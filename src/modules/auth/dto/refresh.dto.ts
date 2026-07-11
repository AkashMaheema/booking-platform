import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RefreshDto {
  @ApiProperty({
    description: 'The valid refresh token issued during login',
  })
  @IsString()
  @IsNotEmpty()
  refreshToken!: string;
}
