import { Test, TestingModule } from '@nestjs/testing';
import { HealthController, ReadyController } from './health.controller';
import { ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

describe('HealthController', () => {
  let controller: HealthController;

  const mockPrismaService = {
    isHealthy: jest.fn().mockResolvedValue(true),
    $connect: jest.fn(),
    $disconnect: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  it('should return liveness status', () => {
    const result = controller.health();
    expect(result.status).toBe('ok');
    expect(result.service).toBe('api');
    expect(result.timestamp).toBeDefined();
    expect(typeof result.uptimeSeconds).toBe('number');
  });
});

describe('ReadyController', () => {
  const prisma = { isHealthy: jest.fn() };
  let controller: ReadyController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new ReadyController(prisma as unknown as PrismaService);
  });

  it('returns ready when PostgreSQL is reachable', async () => {
    prisma.isHealthy.mockResolvedValue(true);

    const result = await controller.ready();

    expect(result.status).toBe('ok');
    expect(result.services.database).toBe('up');
  });

  it('throws HTTP 503 when PostgreSQL is unavailable', async () => {
    prisma.isHealthy.mockResolvedValue(false);

    try {
      await controller.ready();
      throw new Error('Expected readiness to reject');
    } catch (error) {
      expect(error).toBeInstanceOf(ServiceUnavailableException);
      expect((error as ServiceUnavailableException).getStatus()).toBe(503);
    }
  });
});
