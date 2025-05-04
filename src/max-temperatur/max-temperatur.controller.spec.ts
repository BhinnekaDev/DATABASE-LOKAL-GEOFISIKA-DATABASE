import { Test, TestingModule } from '@nestjs/testing';

import { MaxTemperaturController } from '@/max-temperatur/max-temperatur.controller';

describe('MaxTemperaturController', () => {
  let controller: MaxTemperaturController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MaxTemperaturController],
    }).compile();

    controller = module.get<MaxTemperaturController>(MaxTemperaturController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
