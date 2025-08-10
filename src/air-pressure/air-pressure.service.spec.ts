import { Test, TestingModule } from '@nestjs/testing';

import { AirPressureService } from '@/air-pressure/air-pressure.service';

describe('AirPressureService', () => {
  let service: AirPressureService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AirPressureService],
    }).compile();

    service = module.get<AirPressureService>(AirPressureService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
