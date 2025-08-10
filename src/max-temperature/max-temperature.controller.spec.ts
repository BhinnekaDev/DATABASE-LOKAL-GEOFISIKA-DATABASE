import { Test, TestingModule } from '@nestjs/testing';

import { MaxTemperatureController } from '@/max-temperature/max-temperature.controller';

describe('MaxTemperaturController', () => {
  let controller: MaxTemperatureController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MaxTemperatureController],
    }).compile();

    controller = module.get<MaxTemperatureController>(MaxTemperatureController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
