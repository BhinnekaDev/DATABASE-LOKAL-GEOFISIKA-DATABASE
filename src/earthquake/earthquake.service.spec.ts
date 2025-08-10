import { Test, TestingModule } from '@nestjs/testing';

import { EarthquakeService } from '@/earthquake/earthquake.service';

describe('EarthquakeService', () => {
  let service: EarthquakeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EarthquakeService],
    }).compile();

    service = module.get<EarthquakeService>(EarthquakeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
