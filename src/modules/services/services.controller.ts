import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ServicesService } from './services.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { ServiceQueryDto } from './dto/service-query.dto';
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
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.STAFF)
  @ApiOperation({ summary: 'Create a new service (ADMIN, STAFF)' })
  @ApiResponse({ status: 201, description: 'Service created successfully.' })
  @ApiResponse({ status: 409, description: 'Service with this title already exists.' })
  async createService(@Body() createDto: CreateServiceDto) {
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
  @ApiResponse({ status: 200, description: 'Services retrieved successfully.' })
  async getServices(@Query() query: ServiceQueryDto) {
    const result = await this.servicesService.getServices(query);
    return {
      success: true,
      data: {
        items: result.data,
        pagination: result.pagination,
      },
    };
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Retrieve a service by ID (Public)' })
  @ApiResponse({ status: 200, description: 'Service retrieved successfully.' })
  @ApiResponse({ status: 404, description: 'Service not found.' })
  async getService(@Param('id') id: string) {
    const service = await this.servicesService.getService(id);
    return {
      success: true,
      data: service,
    };
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.STAFF)
  @ApiOperation({ summary: 'Update a service (ADMIN, STAFF)' })
  @ApiResponse({ status: 200, description: 'Service updated successfully.' })
  @ApiResponse({ status: 404, description: 'Service not found.' })
  @ApiResponse({ status: 409, description: 'Duplicate title conflict.' })
  async updateService(@Param('id') id: string, @Body() updateDto: UpdateServiceDto) {
    const updatedService = await this.servicesService.updateService(id, updateDto);
    return {
      success: true,
      message: 'Service updated successfully.',
      data: updatedService,
    };
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Delete a service (ADMIN only)' })
  @ApiResponse({ status: 200, description: 'Service deleted successfully.' })
  @ApiResponse({ status: 404, description: 'Service not found.' })
  @ApiResponse({ status: 409, description: 'Cannot delete service due to existing bookings.' })
  async deleteService(@Param('id') id: string) {
    await this.servicesService.deleteService(id);
    return {
      success: true,
      message: 'Service deleted successfully.',
    };
  }
}
