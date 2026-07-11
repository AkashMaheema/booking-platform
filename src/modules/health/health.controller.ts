import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../../database/prisma.service';

interface HealthResponse {
  status: string;
  database: string;
  timestamp: string;
  uptime: number;
  environment: string;
  version: string;
}

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly prismaService: PrismaService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Health check',
    description: 'Returns the current health status of the application and database connection.',
  })
  @ApiResponse({
    status: 200,
    description: 'Application is healthy',
    schema: {
      example: {
        status: 'ok',
        database: 'connected',
        timestamp: '2025-01-01T00:00:00.000Z',
        uptime: 123.45,
        environment: 'development',
        version: '1.0.0',
      },
    },
  })
  @ApiResponse({
    status: 503,
    description: 'Application is unhealthy',
  })
  async check(): Promise<HealthResponse> {
    const dbStatus = await this.checkDatabase();

    return {
      status: 'ok',
      database: dbStatus,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env['NODE_ENV'] ?? 'development',
      version: '1.0.0',
    };
  }

  private async checkDatabase(): Promise<string> {
    try {
      await this.prismaService.$queryRaw`SELECT 1`;
      return 'connected';
    } catch {
      return 'disconnected';
    }
  }
}
