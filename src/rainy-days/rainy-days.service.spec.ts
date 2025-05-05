import { Test, TestingModule } from '@nestjs/testing';

import { RainyDaysService } from '@/rainy-days/rainy-days.service';

describe('RainyDayService', () => {
  let service: RainyDaysService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RainyDaysService],
    }).compile();

    service = module.get<RainyDaysService>(RainyDaysService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
