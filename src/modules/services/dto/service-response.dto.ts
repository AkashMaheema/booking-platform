import { ApiProperty } from '@nestjs/swagger';
import { Service } from '@prisma/client';

export class ServiceResponseDto {
  @ApiProperty({ example: 'uuid-1234', description: 'The unique identifier of the service' })
  id!: string;
  @ApiProperty({ example: 'Haircut', description: 'The title of the service' })
  title!: string;
  @ApiProperty({ example: 'Professional haircut', description: 'Service description', required: false, nullable: true })
  description!: string | null;
  @ApiProperty({ example: 30, description: 'Duration in minutes' })
  duration!: number;
  @ApiProperty({ example: 25.5, description: 'Price of the service' })
  price!: number;
  @ApiProperty({ example: true, description: 'Whether the service is active' })
  isActive!: boolean;
  @ApiProperty({ example: '2026-07-11T12:00:00Z', description: 'Creation timestamp' })
  createdAt!: Date;
  @ApiProperty({ example: '2026-07-11T12:00:00Z', description: 'Last update timestamp' })
  updatedAt!: Date;

  constructor(partial: Partial<Service>) {
    this.id = partial.id!;
    this.title = partial.title!;
    this.description = partial.description ?? null;
    this.duration = partial.duration!;
    // In JS/TS, Prisma Decimal is returned as an object. We'll map it to number.
    this.price = partial.price ? Number(partial.price) : 0;
    this.isActive = partial.isActive!;
    this.createdAt = partial.createdAt!;
    this.updatedAt = partial.updatedAt!;
  }
}
