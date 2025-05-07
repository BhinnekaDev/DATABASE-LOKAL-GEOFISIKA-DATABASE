import { Test, TestingModule } from '@nestjs/testing';

import { HumidityController } from '@/humidity/humidity.controller';

describe('HumidityController', () => {
  let controller: HumidityController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HumidityController],
    }).compile();

    controller = module.get<HumidityController>(HumidityController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
