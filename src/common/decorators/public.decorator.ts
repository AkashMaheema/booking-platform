import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Decorator to mark a route as public.
 * When applied, the JwtAuthGuard will bypass authentication for the endpoint.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
