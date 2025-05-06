import { Test, TestingModule } from '@nestjs/testing';

import { SunshineDurationService } from '@/sunshine-duration/sunshine-duration.service';

describe('SunshineDurationService', () => {
  let service: SunshineDurationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SunshineDurationService],
    }).compile();

    service = module.get<SunshineDurationService>(SunshineDurationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
