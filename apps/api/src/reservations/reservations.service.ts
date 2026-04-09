import {
	BadRequestException,
	ForbiddenException,
	Inject,
	Injectable,
	NotFoundException,
} from '@nestjs/common';
import {
	and,
	asc,
	desc,
	eq,
	gte,
	inArray,
	lt,
	schema,
	type Database,
} from '@smartdine/db';
import { DATABASE } from '../database/lib/definitions';
import { RESERVATION_SLOT_MINUTES } from '../common/constants/reservation.constants';
import { RbacService } from '../rbac/rbac.service';
import { ReservationAvailabilityDto } from './dto/reservation-availability.dto';
import { CreateReservationDto } from './dto/create-reservation.dto';
import type { UserSession } from '@thallesp/nestjs-better-auth';
import type { ReservationStatus } from './lib/reservation-status';

@Injectable()
export class ReservationsService {
	constructor(
		@Inject(DATABASE) private readonly db: Database,
		private readonly rbacService: RbacService,
	) {}

	async getAvailability(restaurantId: string, query: ReservationAvailabilityDto) {
		await this.assertRestaurantExists(restaurantId);

		const requestedStart = new Date(query.from);
		if (Number.isNaN(requestedStart.getTime())) {
			throw new BadRequestException('Invalid reservation date');
		}

		const requestedEnd = this.addMinutes(requestedStart, RESERVATION_SLOT_MINUTES);

		const candidateTables = await this.db.query.restaurantTables.findMany({
			where: (tables) => and(eq(tables.restaurantId, restaurantId), gte(tables.capacity, query.partySize)),
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
					gte(reservations.reservationTime, this.addMinutes(requestedStart, -RESERVATION_SLOT_MINUTES)),
					lt(reservations.reservationTime, this.addMinutes(requestedEnd, RESERVATION_SLOT_MINUTES)),
				),
		});

		const blockedTableIds = new Set(
			relevantReservations
				.filter((reservation) =>
					this.overlaps(
						reservation.reservationTime,
						this.addMinutes(reservation.reservationTime, RESERVATION_SLOT_MINUTES),
						requestedStart,
						requestedEnd,
					),
				)
				.map((reservation) => reservation.tableId),
		);

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

		await this.assertRestaurantExists(restaurantId);

		const table = await this.db.query.restaurantTables.findFirst({
			where: (tables) => and(eq(tables.id, body.tableId), eq(tables.restaurantId, restaurantId)),
		});

		if (!table) {
			throw new NotFoundException('Table not found for this restaurant');
		}

		if (table.capacity < body.partySize) {
			throw new BadRequestException('Selected table capacity is too small for the requested party size');
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
				partySize: body.partySize,
			})
			.returning();

		return reservation;
	}

	async getRestaurantReservations(restaurantId: string) {
		await this.assertRestaurantExists(restaurantId);

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

	async cancelReservation({ reservationId, session }: { reservationId: string; session: UserSession }) {
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

	private async assertRestaurantExists(restaurantId: string) {
		const restaurant = await this.db.query.restaurants.findFirst({
			columns: {
				id: true,
			},
			where: (restaurants) => eq(restaurants.id, restaurantId),
		});

		if (!restaurant) {
			throw new NotFoundException('Restaurant not found');
		}
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
					gte(reservation.reservationTime, this.addMinutes(requestedStart, -RESERVATION_SLOT_MINUTES)),
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
