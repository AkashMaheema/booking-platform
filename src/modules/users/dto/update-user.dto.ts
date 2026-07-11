import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateUserDto {
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
}
