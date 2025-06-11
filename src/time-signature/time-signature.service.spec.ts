import { Test, TestingModule } from '@nestjs/testing';

import { TimeSignatureService } from '@/time-signature/time-signature.service';

describe('TimeSignatureService', () => {
  let service: TimeSignatureService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TimeSignatureService],
    }).compile();

    service = module.get<TimeSignatureService>(TimeSignatureService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
