import { Test, TestingModule } from '@nestjs/testing';

import { AirPressureController } from '@/air-pressure/air-pressure.controller';

describe('AirPressureController', () => {
  let controller: AirPressureController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AirPressureController],
    }).compile();

    controller = module.get<AirPressureController>(AirPressureController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
