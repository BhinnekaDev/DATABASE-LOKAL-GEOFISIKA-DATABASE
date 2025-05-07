import { Test, TestingModule } from '@nestjs/testing';

import { AverageTemperatureController } from '@/average-temperature/average-temperature.controller';

describe('AverageTemperatureController', () => {
  let controller: AverageTemperatureController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AverageTemperatureController],
    }).compile();

    controller = module.get<AverageTemperatureController>(
      AverageTemperatureController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
