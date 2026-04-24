import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { ReservationsService } from './reservations.service';
import { RbacService } from '../rbac/rbac.service';
import { createMockDatabaseProvider } from '../common/testing/test-database.mock';

const createMockSession = (userId: string) => ({
  session: {
    id: 'session-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    userId,
    expiresAt: new Date(),
    token: 'token',
  },
  user: {
    id: userId,
    createdAt: new Date(),
    updatedAt: new Date(),
    email: 'test@example.com',
    emailVerified: true,
    name: 'Test User',
    image: null,
  },
});

describe('ReservationsService', () => {
  let service: ReservationsService;
  let mockDb: any;
  let mockQuery: any;
  let mockRbacService: any;

  beforeEach(async () => {
    const { provider, mockDb: db, mockQuery: query } = createMockDatabaseProvider();
    mockDb = db;
    mockQuery = query;

    mockRbacService = {
      hasPermissions: jest.fn().mockResolvedValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReservationsService,
        provider,
        {
          provide: RbacService,
          useValue: mockRbacService,
        },
      ],
    }).compile();

    service = module.get<ReservationsService>(ReservationsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAvailability', () => {
    it('should return available tables for a reservation slot', async () => {
      const restaurant = {
        id: '1',
        openingHours: {
          monday: { opens: '10:00', closes: '22:00' },
          tuesday: { opens: '10:00', closes: '22:00' },
          wednesday: { opens: '10:00', closes: '22:00' },
          thursday: { opens: '10:00', closes: '22:00' },
          friday: { opens: '10:00', closes: '22:00' },
          saturday: { opens: '11:00', closes: '23:00' },
          sunday: { opens: '11:00', closes: '22:00' },
        },
      };

      const tables = [
        { id: 't1', restaurantId: '1', capacity: 4, tableNumber: '1' },
        { id: 't2', restaurantId: '1', capacity: 2, tableNumber: '2' },
      ];

      mockQuery.restaurants.findFirst.mockResolvedValue(restaurant);
      mockQuery.restaurantTables.findMany.mockResolvedValue(tables);
      mockQuery.reservations.findMany.mockResolvedValue([]);

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);
      futureDate.setHours(12, 0, 0, 0);

      const result = await service.getAvailability('1', {
        from: futureDate.toISOString(),
        partySize: 2,
      });

      expect(result).toBeDefined();
      expect(result.availableTables).toBeDefined();
    });

    it('should return empty available tables when restaurant has no tables', async () => {
      const restaurant = {
        id: '1',
        openingHours: {
          monday: { opens: '10:00', closes: '22:00' },
          tuesday: { opens: '10:00', closes: '22:00' },
          wednesday: { opens: '10:00', closes: '22:00' },
          thursday: { opens: '10:00', closes: '22:00' },
          friday: { opens: '10:00', closes: '22:00' },
          saturday: { opens: '11:00', closes: '23:00' },
          sunday: { opens: '11:00', closes: '22:00' },
        },
      };

      mockQuery.restaurants.findFirst.mockResolvedValue(restaurant);
      mockQuery.restaurantTables.findMany.mockResolvedValue([]);

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);
      futureDate.setHours(12, 0, 0, 0);

      const result = await service.getAvailability('1', {
        from: futureDate.toISOString(),
        partySize: 2,
      });

      expect(result.availableTables).toEqual([]);
    });

    it('should throw BadRequestException for invalid reservation date', async () => {
      const restaurant = {
        id: '1',
        openingHours: {},
      };

      mockQuery.restaurants.findFirst.mockResolvedValue(restaurant);

      await expect(
        service.getAvailability('1', {
          from: 'invalid-date',
          partySize: 2,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when restaurant does not exist', async () => {
      mockQuery.restaurants.findFirst.mockResolvedValue(null);

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);

      await expect(
        service.getAvailability('non-existent', {
          from: futureDate.toISOString(),
          partySize: 2,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should filter out tables with conflicting reservations', async () => {
      const restaurant = {
        id: '1',
        openingHours: {
          monday: { opens: '10:00', closes: '22:00' },
          tuesday: { opens: '10:00', closes: '22:00' },
          wednesday: { opens: '10:00', closes: '22:00' },
          thursday: { opens: '10:00', closes: '22:00' },
          friday: { opens: '10:00', closes: '22:00' },
          saturday: { opens: '11:00', closes: '23:00' },
          sunday: { opens: '11:00', closes: '22:00' },
        },
      };

      const tables = [
        { id: 't1', restaurantId: '1', capacity: 4, tableNumber: '1' },
        { id: 't2', restaurantId: '1', capacity: 2, tableNumber: '2' },
      ];

      const reservations = [
        { id: 'res-1', tableId: 't1', status: 'confirmed' },
      ];

      mockQuery.restaurants.findFirst.mockResolvedValue(restaurant);
      mockQuery.restaurantTables.findMany.mockResolvedValue(tables);
      mockQuery.reservations.findMany.mockResolvedValue(reservations);

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);
      futureDate.setHours(12, 0, 0, 0);

      const result = await service.getAvailability('1', {
        from: futureDate.toISOString(),
        partySize: 2,
      });

      expect(result.availableTables).not.toContainEqual(
        expect.objectContaining({ id: 't1' }),
      );
    });
  });

  describe('createReservation', () => {
    it('should create a new reservation', async () => {
      const restaurant = {
        id: '1',
        openingHours: {
          monday: { opens: '10:00', closes: '22:00' },
          tuesday: { opens: '10:00', closes: '22:00' },
          wednesday: { opens: '10:00', closes: '22:00' },
          thursday: { opens: '10:00', closes: '22:00' },
          friday: { opens: '10:00', closes: '22:00' },
          saturday: { opens: '11:00', closes: '23:00' },
          sunday: { opens: '11:00', closes: '22:00' },
        },
      };

      const table = { id: 't1', restaurantId: '1', capacity: 4 };

      mockQuery.restaurants.findFirst.mockResolvedValue(restaurant);
      mockQuery.restaurantTables.findFirst.mockResolvedValue(table);
      mockQuery.reservations.findMany.mockResolvedValue([]);

      mockDb.insert.mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([
            {
              id: 'res-1',
              restaurantId: '1',
              tableId: 't1',
              status: 'pending',
            },
          ]),
        }),
      });

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);
      futureDate.setHours(12, 0, 0, 0);

      const result = await service.createReservation({
        restaurantId: '1',
        userId: 'user-1',
        body: {
          tableId: 't1',
          reservationTime: futureDate.toISOString(),
          partySize: 2,
        },
      });

      expect(result).toBeDefined();
    });

    it('should throw NotFoundException when table not found', async () => {
      const restaurant = {
        id: '1',
        openingHours: {
          monday: { opens: '10:00', closes: '22:00' },
          tuesday: { opens: '10:00', closes: '22:00' },
          wednesday: { opens: '10:00', closes: '22:00' },
          thursday: { opens: '10:00', closes: '22:00' },
          friday: { opens: '10:00', closes: '22:00' },
          saturday: { opens: '11:00', closes: '23:00' },
          sunday: { opens: '11:00', closes: '22:00' },
        },
      };

      mockQuery.restaurants.findFirst.mockResolvedValue(restaurant);
      mockQuery.restaurantTables.findFirst.mockResolvedValue(null);

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);

      await expect(
        service.createReservation({
          restaurantId: '1',
          userId: 'user-1',
          body: {
            tableId: 't1',
            reservationTime: futureDate.toISOString(),
            partySize: 2,
          },
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when table capacity is insufficient', async () => {
      const restaurant = {
        id: '1',
        openingHours: {
          monday: { opens: '10:00', closes: '22:00' },
          tuesday: { opens: '10:00', closes: '22:00' },
          wednesday: { opens: '10:00', closes: '22:00' },
          thursday: { opens: '10:00', closes: '22:00' },
          friday: { opens: '10:00', closes: '22:00' },
          saturday: { opens: '11:00', closes: '23:00' },
          sunday: { opens: '11:00', closes: '22:00' },
        },
      };

      const table = { id: 't1', restaurantId: '1', capacity: 2 };

      mockQuery.restaurants.findFirst.mockResolvedValue(restaurant);
      mockQuery.restaurantTables.findFirst.mockResolvedValue(table);

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);

      await expect(
        service.createReservation({
          restaurantId: '1',
          userId: 'user-1',
          body: {
            tableId: 't1',
            reservationTime: futureDate.toISOString(),
            partySize: 4,
          },
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when table is already reserved', async () => {
      const restaurant = {
        id: '1',
        openingHours: {
          monday: { opens: '10:00', closes: '22:00' },
          tuesday: { opens: '10:00', closes: '22:00' },
          wednesday: { opens: '10:00', closes: '22:00' },
          thursday: { opens: '10:00', closes: '22:00' },
          friday: { opens: '10:00', closes: '22:00' },
          saturday: { opens: '11:00', closes: '23:00' },
          sunday: { opens: '11:00', closes: '22:00' },
        },
      };

      const table = { id: 't1', restaurantId: '1', capacity: 4 };

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);

      mockQuery.restaurants.findFirst.mockResolvedValue(restaurant);
      mockQuery.restaurantTables.findFirst.mockResolvedValue(table);
      mockQuery.reservations.findMany.mockResolvedValue([
        { id: 'res-1', tableId: 't1', status: 'confirmed', reservationTime: futureDate },
      ]);

      await expect(
        service.createReservation({
          restaurantId: '1',
          userId: 'user-1',
          body: {
            tableId: 't1',
            reservationTime: futureDate.toISOString(),
            partySize: 2,
          },
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getRestaurantReservations', () => {
    it('should return all reservations for a restaurant', async () => {
      const reservations = [
        {
          id: 'res-1',
          restaurantId: '1',
          status: 'confirmed',
          table: { id: 't1', tableNumber: '1', capacity: 4 },
          customer: { id: 'user-1', name: 'John', email: 'john@example.com' },
        },
      ];

      mockQuery.restaurants.findFirst.mockResolvedValue({ id: '1' });
      mockQuery.reservations.findMany.mockResolvedValue(reservations);

      const result = await service.getRestaurantReservations('1');

      expect(result).toEqual(reservations);
    });

    it('should throw NotFoundException when restaurant does not exist', async () => {
      mockQuery.restaurants.findFirst.mockResolvedValue(null);

      await expect(service.getRestaurantReservations('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getMyReservations', () => {
    it('should return user reservations', async () => {
      const reservations = [
        {
          id: 'res-1',
          restaurantId: '1',
          status: 'confirmed',
          restaurant: { id: '1', name: 'Restaurant 1' },
          table: { id: 't1', tableNumber: '1', capacity: 4 },
        },
      ];

      mockQuery.reservations.findMany.mockResolvedValue(reservations);

      const result = await service.getMyReservations('user-1');

      expect(result).toEqual(reservations);
      expect(mockQuery.reservations.findMany).toHaveBeenCalled();
    });
  });

  describe('updateReservationStatus', () => {
    it('should update reservation status', async () => {
      const reservation = {
        id: 'res-1',
        restaurantId: '1',
        status: 'pending',
      };

      mockQuery.reservations.findFirst.mockResolvedValue(reservation);
      mockRbacService.hasPermissions.mockResolvedValue(true);
      mockDb.update.mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([{ ...reservation, status: 'confirmed' }]),
          }),
        }),
      });

      const result = await service.updateReservationStatus({
        reservationId: 'res-1',
        status: 'confirmed',
        session: createMockSession('user-1'),
      });

      expect(result.status).toBe('confirmed');
    });

    it('should throw NotFoundException when reservation does not exist', async () => {
      mockQuery.reservations.findFirst.mockResolvedValue(null);

      await expect(
        service.updateReservationStatus({
          reservationId: 'non-existent',
          status: 'confirmed',
          session: createMockSession('user-1'),
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when user cannot manage reservation', async () => {
      const reservation = {
        id: 'res-1',
        restaurantId: '1',
        status: 'pending',
      };

      mockQuery.reservations.findFirst.mockResolvedValue(reservation);
      mockRbacService.hasPermissions.mockResolvedValue(false);

      await expect(
        service.updateReservationStatus({
          reservationId: 'res-1',
          status: 'confirmed',
          session: createMockSession('user-1'),
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('cancelReservation', () => {
    it('should cancel a reservation as owner', async () => {
      const reservation = {
        id: 'res-1',
        restaurantId: '1',
        customerId: 'user-1',
        status: 'confirmed',
      };

      mockQuery.reservations.findFirst.mockResolvedValue(reservation);
      mockDb.update.mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([{ ...reservation, status: 'cancelled' }]),
          }),
        }),
      });

      const result = await service.cancelReservation({
        reservationId: 'res-1',
        session: createMockSession('user-1'),
      });

      expect(result.status).toBe('cancelled');
    });

    it('should cancel a reservation as staff with permissions', async () => {
      const reservation = {
        id: 'res-1',
        restaurantId: '1',
        customerId: 'user-2',
        status: 'confirmed',
      };

      mockQuery.reservations.findFirst.mockResolvedValue(reservation);
      mockRbacService.hasPermissions.mockResolvedValue(true);
      mockDb.update.mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([{ ...reservation, status: 'cancelled' }]),
          }),
        }),
      });

      const result = await service.cancelReservation({
        reservationId: 'res-1',
        session: createMockSession('user-1'),
      });

      expect(result.status).toBe('cancelled');
    });

    it('should throw BadRequestException when reservation is completed', async () => {
      const reservation = {
        id: 'res-1',
        restaurantId: '1',
        customerId: 'user-1',
        status: 'completed',
      };

      mockQuery.reservations.findFirst.mockResolvedValue(reservation);

      await expect(
        service.cancelReservation({
          reservationId: 'res-1',
          session: createMockSession('user-1'),
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ForbiddenException when user cannot cancel reservation', async () => {
      const reservation = {
        id: 'res-1',
        restaurantId: '1',
        customerId: 'user-2',
        status: 'confirmed',
      };

      mockQuery.reservations.findFirst.mockResolvedValue(reservation);
      mockRbacService.hasPermissions.mockResolvedValue(false);

      await expect(
        service.cancelReservation({
          reservationId: 'res-1',
          session: createMockSession('user-1'),
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException when reservation does not exist', async () => {
      mockQuery.reservations.findFirst.mockResolvedValue(null);

      await expect(
        service.cancelReservation({
          reservationId: 'non-existent',
          session: createMockSession('user-1'),
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
