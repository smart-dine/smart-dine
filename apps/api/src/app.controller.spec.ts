import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

// Mock the AllowAnonymous decorator to avoid loading the ESM module
jest.mock('@thallesp/nestjs-better-auth', () => ({
  AllowAnonymous: () => () => {},
}));

describe('AppController', () => {
  let controller: AppController;
  let service: AppService;

  beforeEach(async () => {
    const mockAppService = {
      getRoot: jest.fn(),
      getHealth: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: AppService,
          useValue: mockAppService,
        },
      ],
    }).compile();

    controller = module.get<AppController>(AppController);
    service = module.get<AppService>(AppService);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    (controller as any)['appService'] = service; // Manually inject the mocked service
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getRoot', () => {
    it('should return the root message', () => {
      const result = {
        message: 'SmartDine API v1.0',
        endpoints: ['GET /api/v1/test - Test endpoint'],
      };
      jest.spyOn(service, 'getRoot').mockReturnValue(result);

      expect(controller.getRoot()).toBe(result);
    });

    it('should call appService.getRoot', () => {
      const spy = jest.spyOn(service, 'getRoot');

      controller.getRoot();

      expect(spy).toHaveBeenCalled();
    });
  });

  describe('getHealth', () => {
    it('should return the health status', () => {
      const result = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
      };
      jest.spyOn(service, 'getHealth').mockReturnValue(result);

      expect(controller.getHealth()).toBe(result);
    });

    it('should call appService.getHealth', () => {
      const spy = jest.spyOn(service, 'getHealth');

      controller.getHealth();

      expect(spy).toHaveBeenCalled();
    });
  });
});
