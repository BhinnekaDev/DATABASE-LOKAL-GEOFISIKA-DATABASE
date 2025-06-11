import { Test, TestingModule } from '@nestjs/testing';

import { EvaporationController } from '@/evaporation/evaporation.controller';

describe('EvaporationController', () => {
  let controller: EvaporationController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EvaporationController],
    }).compile();

    controller = module.get<EvaporationController>(EvaporationController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
