import { Test, TestingModule } from '@nestjs/testing';

import { HumidityService } from '@/humidity/humidity.service';

describe('HumidityService', () => {
  let service: HumidityService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [HumidityService],
    }).compile();

    service = module.get<HumidityService>(HumidityService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
