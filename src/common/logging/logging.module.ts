import { Global, Module } from '@nestjs/common';
import { AuditService } from './audit.service';
import { RequestContextService } from './request-context.service';

@Global()
@Module({
  providers: [AuditService, RequestContextService],
  exports: [AuditService, RequestContextService],
})
export class LoggingModule {}
