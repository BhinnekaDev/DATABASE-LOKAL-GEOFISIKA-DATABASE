import { Test, TestingModule } from '@nestjs/testing';

import { MaxTemperaturService } from '@/max-temperatur/max-temperatur.service';

describe('MaxTemperaturService', () => {
  let service: MaxTemperaturService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MaxTemperaturService],
    }).compile();

    service = module.get<MaxTemperaturService>(MaxTemperaturService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
