import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
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
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @Get('restaurants/:restaurantId/availability')
  getAvailability(
    @Param('restaurantId', ParseUUIDPipe) restaurantId: string,
    @Query() query: ReservationAvailabilityDto,
  ) {
    return this.reservationsService.getAvailability(restaurantId, query);
  }

  @Post('restaurants/:restaurantId/reservations')
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
  getRestaurantReservations(@Param('restaurantId', ParseUUIDPipe) restaurantId: string) {
    return this.reservationsService.getRestaurantReservations(restaurantId);
  }

  @Get('me/reservations')
  getMyReservations(@Session() session: UserSession) {
    return this.reservationsService.getMyReservations(session.user.id);
  }

  @Patch('reservations/:reservationId/status')
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
  cancelReservation(
    @Param('reservationId', ParseUUIDPipe) reservationId: string,
    @Session() session: UserSession,
  ) {
    return this.reservationsService.cancelReservation({ reservationId, session });
  }
}
