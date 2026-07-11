import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator';

/**
 * Guard to verify if the authenticated user has the required roles
 * to access a specific route. Depends on JwtAuthGuard passing first.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    const hasRole = user && requiredRoles.includes(user.role);
    if (!hasRole) {
      const { ForbiddenException } = require('@nestjs/common');
      throw new ForbiddenException('Forbidden');
    }

    return true;
  }
}
