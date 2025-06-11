import { Test, TestingModule } from '@nestjs/testing';

import { RainIntensityService } from '@/rain-intensity/rain-intensity.service';

describe('RainIntensityService', () => {
  let service: RainIntensityService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RainIntensityService],
    }).compile();

    service = module.get<RainIntensityService>(RainIntensityService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
