import { Test, TestingModule } from '@nestjs/testing';
import { RainGaugeController } from '@/rain-gauge/rain-gauge.controller';

describe('RainGaugeController', () => {
  let controller: RainGaugeController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RainGaugeController],
    }).compile();

    controller = module.get<RainGaugeController>(RainGaugeController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
