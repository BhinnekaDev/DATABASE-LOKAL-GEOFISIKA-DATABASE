import { Test, TestingModule } from '@nestjs/testing';

import { MinTemperatureService } from '@/min-temperature/min-temperature.service';

describe('MinTemperaturService', () => {
  let service: MinTemperatureService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MinTemperatureService],
    }).compile();

    service = module.get<MinTemperatureService>(MinTemperatureService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
