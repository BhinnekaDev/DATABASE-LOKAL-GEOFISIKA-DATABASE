import { Test, TestingModule } from '@nestjs/testing';

import { EarthquakeController } from '@/earthquake/earthquake.controller';

describe('EarthquakeController', () => {
  let controller: EarthquakeController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EarthquakeController],
    }).compile();

    controller = module.get<EarthquakeController>(EarthquakeController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
