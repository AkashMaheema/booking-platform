import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
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
} from '@nestjs/swagger';
import { ErrorResponseDto } from '../../common/dto/error-response.dto';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';
import { BookingQueryDto } from './dto/booking-query.dto';
import { BookingResponseDto } from './dto/booking-response.dto';
import { PaginationMeta } from '../../common/utils/pagination.util';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Bookings')
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Public()
  @Post()
  @ApiOperation({ summary: 'Create a new booking (Public)' })
  @ApiCreatedResponse({
    description: 'Booking created successfully.',
    schema: {
      example: {
        success: true,
        message: 'Booking created successfully.',
        data: {
          id: 'uuid-1234',
          customerName: 'John Doe',
          customerEmail: 'john@example.com',
          customerPhone: '+60123456789',
          bookingDate: '2026-08-20',
          bookingTime: '14:00',
          status: 'PENDING',
          serviceId: 'uuid-service',
        },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Validation error or past booking date.',
    type: ErrorResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Service not found.', type: ErrorResponseDto })
  @ApiConflictResponse({
    description: 'Service is inactive or duplicate booking exists.',
    type: ErrorResponseDto,
  })
  async createBooking(
    @Body() createDto: CreateBookingDto,
  ): Promise<{ success: boolean; message: string; data: BookingResponseDto }> {
    const booking = await this.bookingsService.createBooking(createDto);
    return {
      success: true,
      message: 'Booking created successfully.',
      data: booking,
    };
  }

  @Get()
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Retrieve paginated list of bookings (Authenticated)' })
  @ApiOkResponse({
    description: 'Bookings retrieved successfully.',
    schema: {
      example: {
        success: true,
        data: [
          {
            id: 'uuid-1234',
            customerName: 'John Doe',
            bookingDate: '2026-08-20',
            bookingTime: '14:00',
            status: 'PENDING',
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
  @ApiUnauthorizedResponse({ description: 'Unauthorized.', type: ErrorResponseDto })
  @ApiBadRequestResponse({ description: 'Bad Request.', type: ErrorResponseDto })
  async getBookings(@Query() query: BookingQueryDto): Promise<{
    success: boolean;
    data: BookingResponseDto[];
    meta: PaginationMeta;
  }> {
    const result = await this.bookingsService.getBookings(query);
    return {
      success: true,
      data: result.data,
      meta: result.meta,
    };
  }

  @Get(':id')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Retrieve a booking by ID (Authenticated)' })
  @ApiOkResponse({
    description: 'Booking retrieved successfully.',
    schema: {
      example: {
        success: true,
        data: {
          id: 'uuid-1234',
          customerName: 'John Doe',
          bookingDate: '2026-08-20',
          bookingTime: '14:00',
          status: 'PENDING',
        },
      },
    },
  })
  @ApiNotFoundResponse({ description: 'Booking not found.', type: ErrorResponseDto })
  @ApiUnauthorizedResponse({ description: 'Unauthorized.', type: ErrorResponseDto })
  async getBooking(
    @Param('id') id: string,
  ): Promise<{ success: boolean; data: BookingResponseDto }> {
    const booking = await this.bookingsService.getBooking(id);
    return {
      success: true,
      data: booking,
    };
  }

  @Patch(':id/status')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update booking status (Authenticated)' })
  @ApiOkResponse({
    description: 'Booking status updated successfully.',
    schema: {
      example: {
        success: true,
        data: {
          id: 'uuid-1234',
          status: 'CONFIRMED',
        },
      },
    },
  })
  @ApiNotFoundResponse({ description: 'Booking not found.', type: ErrorResponseDto })
  @ApiConflictResponse({ description: 'Invalid status transition.', type: ErrorResponseDto })
  @ApiBadRequestResponse({ description: 'Bad Request.', type: ErrorResponseDto })
  @ApiUnauthorizedResponse({ description: 'Unauthorized.', type: ErrorResponseDto })
  async updateStatus(
    @Param('id') id: string,
    @Body() updateDto: UpdateBookingStatusDto,
  ): Promise<{ success: boolean; data: BookingResponseDto }> {
    const updatedBooking = await this.bookingsService.updateStatus(id, updateDto);
    return {
      success: true,
      data: updatedBooking,
    };
  }

  @Patch(':id/cancel')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Cancel a booking (Authenticated)' })
  @ApiOkResponse({
    description: 'Booking cancelled successfully.',
    schema: {
      example: {
        success: true,
        data: {
          id: 'uuid-1234',
          status: 'CANCELLED',
        },
      },
    },
  })
  @ApiNotFoundResponse({ description: 'Booking not found.', type: ErrorResponseDto })
  @ApiConflictResponse({
    description: 'Completed bookings cannot be cancelled.',
    type: ErrorResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized.', type: ErrorResponseDto })
  async cancelBooking(
    @Param('id') id: string,
  ): Promise<{ success: boolean; data: BookingResponseDto }> {
    const cancelledBooking = await this.bookingsService.cancelBooking(id);
    return {
      success: true,
      data: cancelledBooking,
    };
  }
}
