import { Test, TestingModule } from '@nestjs/testing';

import { RainyDaysController } from '@/rainy-days/rainy-days.controller';

describe('RainyDayController', () => {
  let controller: RainyDaysController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RainyDaysController],
    }).compile();

    controller = module.get<RainyDaysController>(RainyDaysController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
