import { Test, TestingModule } from '@nestjs/testing';

import { RainIntensityController } from '@/rain-intensity/rain-intensity.controller';

describe('RainIntensityController', () => {
  let controller: RainIntensityController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RainIntensityController],
    }).compile();

    controller = module.get<RainIntensityController>(RainIntensityController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
