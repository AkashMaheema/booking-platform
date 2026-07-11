import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';
import { BookingQueryDto } from './dto/booking-query.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Role } from '@prisma/client';

@ApiTags('Bookings')
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Public()
  @Post()
  @ApiOperation({ summary: 'Create a new booking (Public)' })
  @ApiResponse({ status: 201, description: 'Booking created successfully.' })
  @ApiResponse({ status: 400, description: 'Validation error or past booking date.' })
  @ApiResponse({ status: 404, description: 'Service not found.' })
  @ApiResponse({ status: 409, description: 'Service is inactive or duplicate booking exists.' })
  async createBooking(@Body() createDto: CreateBookingDto) {
    const booking = await this.bookingsService.createBooking(createDto);
    return {
      success: true,
      message: 'Booking created successfully.',
      data: booking,
    };
  }

  @Get()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Retrieve paginated list of bookings (Authenticated)' })
  @ApiResponse({ status: 200, description: 'Bookings retrieved successfully.' })
  async getBookings(@Query() query: BookingQueryDto) {
    const result = await this.bookingsService.getBookings(query);
    return {
      success: true,
      data: {
        items: result.data,
        pagination: result.pagination,
      },
    };
  }

  @Get(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Retrieve a booking by ID (Authenticated)' })
  @ApiResponse({ status: 200, description: 'Booking retrieved successfully.' })
  @ApiResponse({ status: 404, description: 'Booking not found.' })
  async getBooking(@Param('id') id: string) {
    const booking = await this.bookingsService.getBooking(id);
    return {
      success: true,
      data: booking,
    };
  }

  @Patch(':id/status')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update booking status (Authenticated)' })
  @ApiResponse({ status: 200, description: 'Booking status updated successfully.' })
  @ApiResponse({ status: 404, description: 'Booking not found.' })
  @ApiResponse({ status: 409, description: 'Invalid status transition.' })
  async updateStatus(@Param('id') id: string, @Body() updateDto: UpdateBookingStatusDto) {
    const updatedBooking = await this.bookingsService.updateStatus(id, updateDto);
    return {
      success: true,
      data: updatedBooking,
    };
  }

  @Patch(':id/cancel')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Cancel a booking (Authenticated)' })
  @ApiResponse({ status: 200, description: 'Booking cancelled successfully.' })
  @ApiResponse({ status: 404, description: 'Booking not found.' })
  @ApiResponse({ status: 409, description: 'Completed bookings cannot be cancelled.' })
  async cancelBooking(@Param('id') id: string) {
    const cancelledBooking = await this.bookingsService.cancelBooking(id);
    return {
      success: true,
      data: cancelledBooking,
    };
  }
}
