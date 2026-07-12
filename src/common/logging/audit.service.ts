import { Injectable, Logger } from '@nestjs/common';
import { RequestContextService } from './request-context.service';

export enum AuditAction {
  USER_REGISTERED = 'USER_REGISTERED',
  USER_LOGGED_IN = 'USER_LOGGED_IN',
  USER_PASSWORD_CHANGED = 'USER_PASSWORD_CHANGED',
  USER_DEACTIVATED = 'USER_DEACTIVATED',
  USER_UPDATED = 'USER_UPDATED',
  SERVICE_CREATED = 'SERVICE_CREATED',
  SERVICE_UPDATED = 'SERVICE_UPDATED',
  SERVICE_DELETED = 'SERVICE_DELETED',
  BOOKING_CREATED = 'BOOKING_CREATED',
  BOOKING_CONFIRMED = 'BOOKING_CONFIRMED',
  BOOKING_CANCELLED = 'BOOKING_CANCELLED',
  BOOKING_COMPLETED = 'BOOKING_COMPLETED',
}

export interface AuditLog {
  action: AuditAction;
  resource: string;
  resourceId?: string;
  details?: unknown;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger('AuditService');

  log(auditData: AuditLog): void {
    const requestId = RequestContextService.get('requestId');
    const userId = RequestContextService.get('userId');

    this.logger.log({
      isAudit: true, // Marker for potential additional filtering
      action: auditData.action,
      resource: auditData.resource,
      resourceId: auditData.resourceId,
      details: auditData.details,
      requestId,
      userId,
      timestamp: new Date().toISOString(),
    });
  }
}
