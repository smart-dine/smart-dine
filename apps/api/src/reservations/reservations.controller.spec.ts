// Mock ESM modules before importing anything else
jest.mock('@thallesp/nestjs-better-auth', () => ({
  AllowAnonymous: () => () => {},
  Session: () => () => {},
}));

jest.mock('../rbac/decorators/require-permissions.decorator', () => ({
  RequireRestaurantPermissions: () => () => {},
}));

import { Test, TestingModule } from '@nestjs/testing';
import { ReservationsController } from './reservations.controller';
import { ReservationsService } from './reservations.service';

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

describe('ReservationsController', () => {
  let controller: ReservationsController;
  let service: ReservationsService;

  const mockReservationsService = {
    getAvailability: jest.fn(),
    createReservation: jest.fn(),
    getMyReservations: jest.fn(),
    getRestaurantReservations: jest.fn(),
    updateReservationStatus: jest.fn(),
    cancelReservation: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReservationsController],
      providers: [
        {
          provide: ReservationsService,
          useValue: mockReservationsService,
        },
      ],
    }).compile();

    controller = module.get<ReservationsController>(ReservationsController);
    service = module.get<ReservationsService>(ReservationsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAvailability', () => {
    it('should return available tables for a restaurant', async () => {
      const availability = {
        requestedFrom: new Date().toISOString(),
        requestedUntil: new Date().toISOString(),
        availableTables: [{ id: 't1', tableNumber: '1', capacity: 4 }],
      };

      mockReservationsService.getAvailability.mockResolvedValue(availability);

      const result = await controller.getAvailability('1', {
        from: new Date().toISOString(),
        partySize: 2,
      });

      expect(result).toEqual(availability);
      expect(service.getAvailability).toHaveBeenCalledWith('1', {
        from: expect.any(String),
        partySize: 2,
      });
    });
  });

  describe('createReservation', () => {
    it('should create a new reservation', async () => {
      const reservation = {
        id: 'res-1',
        restaurantId: '1',
        status: 'pending',
      };

      mockReservationsService.createReservation.mockResolvedValue(reservation);

      const result = await controller.createReservation(
        '1',
        {
          tableId: 't1',
          reservationTime: new Date().toISOString(),
          partySize: 2,
        },
        createMockSession('user-1'),
      );

      expect(result).toEqual(reservation);
      expect(service.createReservation).toHaveBeenCalled();
    });
  });

  describe('getMyReservations', () => {
    it('should return user reservations', async () => {
      const reservations = [{ id: 'res-1', restaurantId: '1', status: 'confirmed' }];

      mockReservationsService.getMyReservations.mockResolvedValue(reservations);

      const result = await controller.getMyReservations(createMockSession('user-1'));

      expect(result).toEqual(reservations);
      expect(service.getMyReservations).toHaveBeenCalledWith('user-1');
    });
  });

  describe('getRestaurantReservations', () => {
    it('should return reservations for a restaurant', async () => {
      const reservations = [{ id: 'res-1', restaurantId: '1', status: 'confirmed' }];

      mockReservationsService.getRestaurantReservations.mockResolvedValue(reservations);

      const result = await controller.getRestaurantReservations('1');

      expect(result).toEqual(reservations);
      expect(service.getRestaurantReservations).toHaveBeenCalledWith('1');
    });
  });

  describe('updateStatus', () => {
    it('should update reservation status', async () => {
      const updated = {
        id: 'res-1',
        restaurantId: '1',
        status: 'confirmed',
      };

      mockReservationsService.updateReservationStatus.mockResolvedValue(updated);

      const result = await controller.updateStatus(
        'res-1',
        { status: 'confirmed' },
        createMockSession('user-1'),
      );

      expect(result).toEqual(updated);
      expect(service.updateReservationStatus).toHaveBeenCalled();
    });
  });

  describe('cancelReservation', () => {
    it('should cancel a reservation', async () => {
      const cancelled = {
        id: 'res-1',
        restaurantId: '1',
        status: 'cancelled',
      };

      mockReservationsService.cancelReservation.mockResolvedValue(cancelled);

      const result = await controller.cancelReservation('res-1', createMockSession('user-1'));

      expect(result).toEqual(cancelled);
      expect(service.cancelReservation).toHaveBeenCalledWith(
        expect.objectContaining({
          reservationId: 'res-1',
          session: expect.objectContaining({
            session: expect.objectContaining({
              id: 'session-1',
              userId: 'user-1',
              token: 'token',
            }),
            user: expect.objectContaining({
              id: 'user-1',
              email: 'test@example.com',
              emailVerified: true,
              name: 'Test User',
              image: null,
            }),
          }),
        }),
      );
    });
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
