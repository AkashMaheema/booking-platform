import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateServiceDto {
  @ApiProperty({
    example: 'Haircut',
    description: 'The title of the service',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(100)
  title!: string;

  @ApiPropertyOptional({
    example: 'Professional haircut service',
    description: 'A detailed description of the service',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiProperty({
    example: 30,
    description: 'Duration in minutes',
  })
  @IsInt()
  @Min(1)
  @Max(1440)
  @Type(() => Number)
  duration!: number;

  @ApiProperty({
    example: 25.5,
    description: 'Price of the service',
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01) // positive decimal
  @Max(999999.99)
  @Type(() => Number)
  price!: number;

  @ApiPropertyOptional({
    example: true,
    description: 'Is the service currently active',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isActive?: boolean = true;
}
