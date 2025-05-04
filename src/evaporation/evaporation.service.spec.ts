import { Test, TestingModule } from '@nestjs/testing';

import { EvaporationService } from '@/evaporation/evaporation.service';

describe('EvaporationService', () => {
  let service: EvaporationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EvaporationService],
    }).compile();

    service = module.get<EvaporationService>(EvaporationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
