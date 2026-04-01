import { Test, TestingModule } from '@nestjs/testing';
import { AppService } from './app.service';

describe('AppService', () => {
  let service: AppService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AppService],
    }).compile();

    service = module.get<AppService>(AppService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getRoot', () => {
    it('should return the root message', () => {
      const result = service.getRoot();
      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
      expect(typeof result.message).toBe('string');
      expect(Array.isArray(result.endpoints)).toBe(true);
    });
  });

  describe('getHealth', () => {
    it('should return the health status', () => {
      const result = service.getHealth();
      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
      expect(result.status).toBe('ok');
      expect(typeof result.timestamp).toBe('string');
      expect(result.version).toBe('1.0.0');
    });
  });
});
