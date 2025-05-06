import { Test, TestingModule } from '@nestjs/testing';

import { RainfallService } from '@/rainfall/rainfall.service';

describe('RainfallService', () => {
  let service: RainfallService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RainfallService],
    }).compile();

    service = module.get<RainfallService>(RainfallService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
