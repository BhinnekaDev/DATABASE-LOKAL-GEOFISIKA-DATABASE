import { Test, TestingModule } from '@nestjs/testing';

import { TimeSignatureController } from '@/time-signature/time-signature.controller';

describe('TimeSignatureController', () => {
  let controller: TimeSignatureController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TimeSignatureController],
    }).compile();

    controller = module.get<TimeSignatureController>(TimeSignatureController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
