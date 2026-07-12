import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiConflictResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
} from '@nestjs/swagger';
import { ErrorResponseDto } from '../../common/dto/error-response.dto';
import { ServicesService } from './services.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { ServiceQueryDto } from './dto/service-query.dto';
import { ServiceResponseDto } from './dto/service-response.dto';
import { PaginationMeta } from '../../common/utils/pagination.util';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Role } from '@prisma/client';

@ApiTags('Services')
@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Post()
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.STAFF)
  @ApiOperation({ summary: 'Create a new service (ADMIN, STAFF)' })
  @ApiCreatedResponse({
    description: 'Service created successfully.',
    schema: {
      example: {
        success: true,
        message: 'Service created successfully.',
        data: {
          id: 'uuid-1234',
          title: 'Haircut',
          description: 'Professional haircut service',
          duration: 30,
          price: 25.5,
          isActive: true,
          createdAt: '2026-07-12T10:30:00Z',
          updatedAt: '2026-07-12T10:30:00Z',
        },
      },
    },
  })
  @ApiConflictResponse({
    description: 'Service with this title already exists.',
    type: ErrorResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Bad Request.', type: ErrorResponseDto })
  @ApiUnauthorizedResponse({ description: 'Unauthorized.', type: ErrorResponseDto })
  @ApiForbiddenResponse({ description: 'Forbidden resource.', type: ErrorResponseDto })
  async createService(
    @Body() createDto: CreateServiceDto,
  ): Promise<{ success: boolean; message: string; data: ServiceResponseDto }> {
    const service = await this.servicesService.createService(createDto);
    return {
      success: true,
      message: 'Service created successfully.',
      data: service,
    };
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'Retrieve paginated list of services (Public)' })
  @ApiOkResponse({
    description: 'Services retrieved successfully.',
    schema: {
      example: {
        success: true,
        data: [
          {
            id: 'uuid-1234',
            title: 'Haircut',
            description: 'Professional haircut service',
            duration: 30,
            price: 25.5,
            isActive: true,
          },
        ],
        meta: {
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Bad Request.', type: ErrorResponseDto })
  async getServices(@Query() query: ServiceQueryDto): Promise<{
    success: boolean;
    data: ServiceResponseDto[];
    meta: PaginationMeta;
  }> {
    const result = await this.servicesService.getServices(query);
    return {
      success: true,
      data: result.data,
      meta: result.meta,
    };
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Retrieve a service by ID (Public)' })
  @ApiOkResponse({
    description: 'Service retrieved successfully.',
    schema: {
      example: {
        success: true,
        data: {
          id: 'uuid-1234',
          title: 'Haircut',
          description: 'Professional haircut service',
          duration: 30,
          price: 25.5,
          isActive: true,
        },
      },
    },
  })
  @ApiNotFoundResponse({ description: 'Service not found.', type: ErrorResponseDto })
  async getService(
    @Param('id') id: string,
  ): Promise<{ success: boolean; data: ServiceResponseDto }> {
    const service = await this.servicesService.getService(id);
    return {
      success: true,
      data: service,
    };
  }

  @Patch(':id')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.STAFF)
  @ApiOperation({ summary: 'Update a service (ADMIN, STAFF)' })
  @ApiOkResponse({
    description: 'Service updated successfully.',
    schema: {
      example: {
        success: true,
        message: 'Service updated successfully.',
        data: {
          id: 'uuid-1234',
          title: 'Updated Haircut',
          description: 'Updated professional haircut service',
          duration: 45,
          price: 30.0,
          isActive: true,
        },
      },
    },
  })
  @ApiNotFoundResponse({ description: 'Service not found.', type: ErrorResponseDto })
  @ApiConflictResponse({ description: 'Duplicate title conflict.', type: ErrorResponseDto })
  @ApiBadRequestResponse({ description: 'Bad Request.', type: ErrorResponseDto })
  @ApiUnauthorizedResponse({ description: 'Unauthorized.', type: ErrorResponseDto })
  @ApiForbiddenResponse({ description: 'Forbidden resource.', type: ErrorResponseDto })
  async updateService(
    @Param('id') id: string,
    @Body() updateDto: UpdateServiceDto,
  ): Promise<{ success: boolean; message: string; data: ServiceResponseDto }> {
    const updatedService = await this.servicesService.updateService(id, updateDto);
    return {
      success: true,
      message: 'Service updated successfully.',
      data: updatedService,
    };
  }

  @Delete(':id')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Delete a service (ADMIN only)' })
  @ApiOkResponse({
    description: 'Service deleted successfully.',
    schema: {
      example: {
        success: true,
        message: 'Service deleted successfully.',
      },
    },
  })
  @ApiNotFoundResponse({ description: 'Service not found.', type: ErrorResponseDto })
  @ApiConflictResponse({
    description: 'Cannot delete service due to existing bookings.',
    type: ErrorResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized.', type: ErrorResponseDto })
  @ApiForbiddenResponse({ description: 'Forbidden resource.', type: ErrorResponseDto })
  async deleteService(@Param('id') id: string): Promise<{ success: boolean; message: string }> {
    await this.servicesService.deleteService(id);
    return {
      success: true,
      message: 'Service deleted successfully.',
    };
  }
}
