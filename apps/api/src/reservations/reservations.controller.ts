import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';
import { RequireRestaurantPermissions } from '../rbac/decorators/require-permissions.decorator';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { ReservationAvailabilityDto } from './dto/reservation-availability.dto';
import { UpdateReservationStatusDto } from './dto/update-reservation-status.dto';
import { ReservationsService } from './reservations.service';

@Controller({
  path: '',
  version: '1',
})
@ApiTags('Reservations')
@ApiCookieAuth('session-cookie')
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @Get('restaurants/:restaurantId/availability')
  @ApiOperation({ summary: 'Check reservation availability for a restaurant and party size' })
  @ApiParam({ name: 'restaurantId', format: 'uuid' })
  @ApiOkResponse({
    description: 'Availability window and candidate tables.',
    schema: {
      type: 'object',
      properties: {
        requestedFrom: { type: 'string', format: 'date-time' },
        requestedUntil: { type: 'string', format: 'date-time' },
        availableTables: {
          type: 'array',
          items: { type: 'object' },
        },
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Invalid query values.' })
  @ApiUnauthorizedResponse({ description: 'Authentication is required.' })
  @ApiNotFoundResponse({ description: 'Restaurant not found.' })
  getAvailability(
    @Param('restaurantId', ParseUUIDPipe) restaurantId: string,
    @Query() query: ReservationAvailabilityDto,
  ) {
    return this.reservationsService.getAvailability(restaurantId, query);
  }

  @Post('restaurants/:restaurantId/reservations')
  @ApiOperation({ summary: 'Create a reservation for the authenticated user' })
  @ApiParam({ name: 'restaurantId', format: 'uuid' })
  @ApiCreatedResponse({
    description: 'Reservation created.',
    schema: {
      type: 'object',
    },
  })
  @ApiBadRequestResponse({
    description:
      'Invalid reservation payload, conflicting time slot, or insufficient table capacity.',
  })
  @ApiUnauthorizedResponse({ description: 'Authentication is required.' })
  @ApiNotFoundResponse({ description: 'Restaurant or table not found.' })
  createReservation(
    @Param('restaurantId', ParseUUIDPipe) restaurantId: string,
    @Body() body: CreateReservationDto,
    @Session() session: UserSession,
  ) {
    return this.reservationsService.createReservation({
      restaurantId,
      userId: session.user.id,
      body,
    });
  }

  @Get('restaurants/:restaurantId/reservations')
  @RequireRestaurantPermissions(['reservations:manage'])
  @ApiOperation({ summary: 'List all reservations for a restaurant' })
  @ApiParam({ name: 'restaurantId', format: 'uuid' })
  @ApiOkResponse({
    description: 'Restaurant reservation list.',
    schema: {
      type: 'array',
      items: { type: 'object' },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Authentication is required.' })
  @ApiForbiddenResponse({ description: 'Missing reservations:manage permission for restaurant.' })
  @ApiNotFoundResponse({ description: 'Restaurant not found.' })
  getRestaurantReservations(@Param('restaurantId', ParseUUIDPipe) restaurantId: string) {
    return this.reservationsService.getRestaurantReservations(restaurantId);
  }

  @Get('me/reservations')
  @ApiOperation({ summary: 'List reservations for the current authenticated user' })
  @ApiOkResponse({
    description: 'Reservations owned by the authenticated user.',
    schema: {
      type: 'array',
      items: { type: 'object' },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Authentication is required.' })
  getMyReservations(@Session() session: UserSession) {
    return this.reservationsService.getMyReservations(session.user.id);
  }

  @Patch('reservations/:reservationId/status')
  @ApiOperation({ summary: 'Update reservation status for staff/owners with permission' })
  @ApiParam({ name: 'reservationId', format: 'uuid' })
  @ApiOkResponse({
    description: 'Reservation status updated.',
    schema: {
      type: 'object',
    },
  })
  @ApiBadRequestResponse({ description: 'Invalid status value.' })
  @ApiUnauthorizedResponse({ description: 'Authentication is required.' })
  @ApiForbiddenResponse({ description: 'Missing permission to modify reservation.' })
  @ApiNotFoundResponse({ description: 'Reservation not found.' })
  updateStatus(
    @Param('reservationId', ParseUUIDPipe) reservationId: string,
    @Body() body: UpdateReservationStatusDto,
    @Session() session: UserSession,
  ) {
    return this.reservationsService.updateReservationStatus({
      reservationId,
      status: body.status,
      session,
    });
  }

  @Patch('reservations/:reservationId/cancel')
  @ApiOperation({ summary: 'Cancel a reservation as the owner or authorized staff' })
  @ApiParam({ name: 'reservationId', format: 'uuid' })
  @ApiOkResponse({
    description: 'Reservation cancelled.',
    schema: {
      type: 'object',
    },
  })
  @ApiBadRequestResponse({ description: 'Completed reservations cannot be cancelled.' })
  @ApiUnauthorizedResponse({ description: 'Authentication is required.' })
  @ApiForbiddenResponse({ description: 'Missing permission to cancel this reservation.' })
  @ApiNotFoundResponse({ description: 'Reservation not found.' })
  cancelReservation(
    @Param('reservationId', ParseUUIDPipe) reservationId: string,
    @Session() session: UserSession,
  ) {
    return this.reservationsService.cancelReservation({ reservationId, session });
  }
}
