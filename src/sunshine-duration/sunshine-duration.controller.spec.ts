import { Test, TestingModule } from '@nestjs/testing';

import { SunshineDurationController } from '@/sunshine-duration/sunshine-duration.controller';

describe('SunshineDurationController', () => {
  let controller: SunshineDurationController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SunshineDurationController],
    }).compile();

    controller = module.get<SunshineDurationController>(
      SunshineDurationController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
