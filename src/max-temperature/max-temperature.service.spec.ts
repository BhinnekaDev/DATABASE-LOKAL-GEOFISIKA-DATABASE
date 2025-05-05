import { Test, TestingModule } from '@nestjs/testing';

import { MaxTemperatureService } from '@/max-temperature/max-temperature.service';

describe('MaxTemperaturService', () => {
  let service: MaxTemperatureService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MaxTemperatureService],
    }).compile();

    service = module.get<MaxTemperatureService>(MaxTemperatureService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
