import { Service } from '@prisma/client';

export class ServiceResponseDto {
  id!: string;
  title!: string;
  description!: string | null;
  duration!: number;
  price!: number;
  isActive!: boolean;
  createdAt!: Date;
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
