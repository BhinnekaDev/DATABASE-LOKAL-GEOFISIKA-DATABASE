import { Test, TestingModule } from '@nestjs/testing';

import { RainfallController } from '@/rainfall/rainfall.controller';

describe('RainfallController', () => {
  let controller: RainfallController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RainfallController],
    }).compile();

    controller = module.get<RainfallController>(RainfallController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
