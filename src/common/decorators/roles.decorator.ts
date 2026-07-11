import { SetMetadata } from '@nestjs/common';
import { Role } from '@prisma/client';

export const ROLES_KEY = 'roles';

/**
 * Decorator to specify required roles for a route.
 * Used in conjunction with RolesGuard.
 * @param roles Array of allowed Role enums.
 */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
