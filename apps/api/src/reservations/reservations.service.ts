import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, asc, desc, eq, gte, inArray, lt, schema, type Database } from '@smartdine/db';
import { DATABASE } from '../database/lib/definitions';
import { RESERVATION_SLOT_MINUTES } from '../common/constants/reservation.constants';
import { RbacService } from '../rbac/rbac.service';
import { ReservationAvailabilityDto } from './dto/reservation-availability.dto';
import { CreateReservationDto } from './dto/create-reservation.dto';
import type { UserSession } from '@thallesp/nestjs-better-auth';
import type { ReservationStatus } from './lib/reservation-status';

type DayKey = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

type OpeningHoursEntry = {
  opens?: string | null;
  closes?: string | null;
  isClosed?: boolean | null;
};

type OpeningHoursRecord = Partial<Record<DayKey, OpeningHoursEntry>>;

const dayKeyByJsDay: DayKey[] = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
];

@Injectable()
export class ReservationsService {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    private readonly rbacService: RbacService,
  ) {}

  async getAvailability(restaurantId: string, query: ReservationAvailabilityDto) {
    const restaurant = await this.getRestaurantOrThrow(restaurantId);

    const requestedStart = new Date(query.from);
    if (Number.isNaN(requestedStart.getTime())) {
      throw new BadRequestException('Invalid reservation date');
    }

    this.assertWithinOpeningHours(restaurant.openingHours, requestedStart);

    const requestedEnd = this.addMinutes(requestedStart, RESERVATION_SLOT_MINUTES);

    const candidateTables = await this.db.query.restaurantTables.findMany({
      where: (tables) =>
        and(eq(tables.restaurantId, restaurantId), gte(tables.capacity, query.partySize)),
      orderBy: (tables) => [asc(tables.capacity), asc(tables.tableNumber)],
    });

    if (candidateTables.length === 0) {
      return {
        requestedFrom: requestedStart.toISOString(),
        requestedUntil: requestedEnd.toISOString(),
        availableTables: [],
      };
    }

    const relevantReservations = await this.db.query.reservations.findMany({
      where: (reservations) =>
        and(
          eq(reservations.restaurantId, restaurantId),
          inArray(reservations.status, ['pending', 'confirmed']),
          lt(reservations.reservationTime, requestedEnd),
          gte(reservations.reservationEndTime, requestedStart),
        ),
    });

    const blockedTableIds = new Set(relevantReservations.map((reservation) => reservation.tableId));

    return {
      requestedFrom: requestedStart.toISOString(),
      requestedUntil: requestedEnd.toISOString(),
      availableTables: candidateTables.filter((table) => !blockedTableIds.has(table.id)),
    };
  }

  async createReservation({
    restaurantId,
    userId,
    body,
  }: {
    restaurantId: string;
    userId: string;
    body: CreateReservationDto;
  }) {
    const requestedStart = new Date(body.reservationTime);
    if (Number.isNaN(requestedStart.getTime())) {
      throw new BadRequestException('Invalid reservation date');
    }

    const restaurant = await this.getRestaurantOrThrow(restaurantId);
    this.assertWithinOpeningHours(restaurant.openingHours, requestedStart);

    const table = await this.db.query.restaurantTables.findFirst({
      where: (tables) => and(eq(tables.id, body.tableId), eq(tables.restaurantId, restaurantId)),
    });

    if (!table) {
      throw new NotFoundException('Table not found for this restaurant');
    }

    if (table.capacity < body.partySize) {
      throw new BadRequestException(
        'Selected table capacity is too small for the requested party size',
      );
    }

    const conflictingReservation = await this.findConflictingTableReservation({
      restaurantId,
      tableId: body.tableId,
      requestedStart,
    });

    if (conflictingReservation) {
      throw new BadRequestException('Selected table is not available for the requested time');
    }

    const [reservation] = await this.db
      .insert(schema.reservations)
      .values({
        restaurantId,
        tableId: body.tableId,
        customerId: userId,
        reservationTime: requestedStart,
        reservationEndTime: this.addMinutes(requestedStart, RESERVATION_SLOT_MINUTES),
        partySize: body.partySize,
      })
      .returning();

    return reservation;
  }

  async getRestaurantReservations(restaurantId: string) {
    await this.getRestaurantOrThrow(restaurantId);

    return await this.db.query.reservations.findMany({
      where: (reservations) => eq(reservations.restaurantId, restaurantId),
      orderBy: (reservations) => desc(reservations.reservationTime),
      with: {
        table: {
          columns: {
            id: true,
            tableNumber: true,
            capacity: true,
          },
        },
        customer: {
          columns: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });
  }

  async getMyReservations(userId: string) {
    return await this.db.query.reservations.findMany({
      where: (reservations) => eq(reservations.customerId, userId),
      orderBy: (reservations) => desc(reservations.reservationTime),
      with: {
        restaurant: {
          columns: {
            id: true,
            name: true,
            address: true,
            phone: true,
            images: true,
          },
        },
        table: {
          columns: {
            id: true,
            tableNumber: true,
            capacity: true,
          },
        },
      },
    });
  }

  async updateReservationStatus({
    reservationId,
    status,
    session,
  }: {
    reservationId: string;
    status: ReservationStatus;
    session: UserSession;
  }) {
    const reservation = await this.getReservationOrThrow(reservationId);

    const canManage = await this.rbacService.hasPermissions({
      session,
      permissions: ['reservations:manage'],
      restaurantId: reservation.restaurantId,
    });

    if (!canManage) {
      throw new ForbiddenException('You cannot modify this reservation');
    }

    const [updated] = await this.db
      .update(schema.reservations)
      .set({ status })
      .where(eq(schema.reservations.id, reservationId))
      .returning();

    return updated;
  }

  async cancelReservation({
    reservationId,
    session,
  }: {
    reservationId: string;
    session: UserSession;
  }) {
    const reservation = await this.getReservationOrThrow(reservationId);

    if (reservation.status === 'completed') {
      throw new BadRequestException('Completed reservations cannot be cancelled');
    }

    const isOwner = reservation.customerId === session.user.id;
    if (!isOwner) {
      const canManage = await this.rbacService.hasPermissions({
        session,
        permissions: ['reservations:manage'],
        restaurantId: reservation.restaurantId,
      });

      if (!canManage) {
        throw new ForbiddenException('You cannot cancel this reservation');
      }
    }

    const [updated] = await this.db
      .update(schema.reservations)
      .set({ status: 'cancelled' })
      .where(eq(schema.reservations.id, reservationId))
      .returning();

    return updated;
  }

  private async getRestaurantOrThrow(restaurantId: string) {
    const restaurant = await this.db.query.restaurants.findFirst({
      columns: {
        id: true,
        openingHours: true,
      },
      where: (restaurants) => eq(restaurants.id, restaurantId),
    });

    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }

    return restaurant;
  }

  private assertWithinOpeningHours(openingHours: unknown, reservationStart: Date) {
    const reservationEnd = this.addMinutes(reservationStart, RESERVATION_SLOT_MINUTES);

    if (this.isWithinOpeningHours(openingHours, reservationStart, reservationEnd)) {
      return;
    }

    throw new BadRequestException('Restaurant is closed at the requested reservation time');
  }

  private isWithinOpeningHours(
    openingHours: unknown,
    reservationStart: Date,
    reservationEnd: Date,
  ) {
    const hours = this.toOpeningHoursRecord(openingHours);
    const baseStartDate = new Date(reservationStart);
    baseStartDate.setHours(0, 0, 0, 0);

    for (const offset of [-1, 0]) {
      const dayDate = new Date(baseStartDate);
      dayDate.setDate(baseStartDate.getDate() + offset);

      const intervals = this.getOpeningIntervalsForDate(hours, dayDate);
      const canFitReservation = intervals.some(
        (interval) => reservationStart >= interval.start && reservationEnd <= interval.end,
      );

      if (canFitReservation) {
        return true;
      }
    }

    return false;
  }

  private getOpeningIntervalsForDate(hours: OpeningHoursRecord, dayDate: Date) {
    const dayKey = dayKeyByJsDay[dayDate.getDay()];
    const entry = hours[dayKey];

    if (!entry || entry.isClosed) {
      return [];
    }

    const opensMinutes = this.parseTimeToMinutes(entry.opens);
    const closesMinutes = this.parseTimeToMinutes(entry.closes);

    if (opensMinutes === null || closesMinutes === null) {
      return [];
    }

    const start = new Date(dayDate);
    start.setHours(0, 0, 0, 0);
    start.setMinutes(opensMinutes);

    const end = new Date(dayDate);
    end.setHours(0, 0, 0, 0);
    end.setMinutes(closesMinutes);

    if (closesMinutes <= opensMinutes) {
      end.setDate(end.getDate() + 1);
    }

    return [{ start, end }];
  }

  private toOpeningHoursRecord(openingHours: unknown): OpeningHoursRecord {
    if (!openingHours || typeof openingHours !== 'object') {
      return {};
    }

    return openingHours as OpeningHoursRecord;
  }

  private parseTimeToMinutes(value: string | null | undefined) {
    if (!value) {
      return null;
    }

    const matched = /^(\d{2}):(\d{2})$/.exec(value);
    if (!matched) {
      return null;
    }

    const hours = Number(matched[1]);
    const minutes = Number(matched[2]);

    if (hours > 23 || minutes > 59) {
      return null;
    }

    return hours * 60 + minutes;
  }

  private async getReservationOrThrow(reservationId: string) {
    const reservation = await this.db.query.reservations.findFirst({
      where: (reservations) => eq(reservations.id, reservationId),
    });

    if (!reservation) {
      throw new NotFoundException('Reservation not found');
    }

    return reservation;
  }

  private async findConflictingTableReservation({
    restaurantId,
    tableId,
    requestedStart,
  }: {
    restaurantId: string;
    tableId: string;
    requestedStart: Date;
  }) {
    const requestedEnd = this.addMinutes(requestedStart, RESERVATION_SLOT_MINUTES);

    const reservations = await this.db.query.reservations.findMany({
      where: (reservation) =>
        and(
          eq(reservation.restaurantId, restaurantId),
          eq(reservation.tableId, tableId),
          inArray(reservation.status, ['pending', 'confirmed']),
          gte(
            reservation.reservationTime,
            this.addMinutes(requestedStart, -RESERVATION_SLOT_MINUTES),
          ),
          lt(reservation.reservationTime, this.addMinutes(requestedEnd, RESERVATION_SLOT_MINUTES)),
        ),
    });

    return reservations.find((reservation) =>
      this.overlaps(
        reservation.reservationTime,
        this.addMinutes(reservation.reservationTime, RESERVATION_SLOT_MINUTES),
        requestedStart,
        requestedEnd,
      ),
    );
  }

  private overlaps(startA: Date, endA: Date, startB: Date, endB: Date) {
    return startA < endB && endA > startB;
  }

  private addMinutes(date: Date, minutes: number) {
    return new Date(date.getTime() + minutes * 60_000);
  }
}
