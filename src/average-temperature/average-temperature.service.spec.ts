import { Test, TestingModule } from '@nestjs/testing';

import { AverageTemperatureService } from '@/average-temperature/average-temperature.service';

describe('AverageTemperatureService', () => {
  let service: AverageTemperatureService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AverageTemperatureService],
    }).compile();

    service = module.get<AverageTemperatureService>(AverageTemperatureService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
