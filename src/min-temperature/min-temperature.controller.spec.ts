import { Test, TestingModule } from '@nestjs/testing';

import { MinTemperatureController } from '@/min-temperature/min-temperature.controller';

describe('MinTemperaturController', () => {
  let controller: MinTemperatureController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MinTemperatureController],
    }).compile();

    controller = module.get<MinTemperatureController>(MinTemperatureController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
