import { Test, TestingModule } from '@nestjs/testing';
import { WindDirectionAndSpeedController } from './wind-direction-and-speed.controller';

describe('WindDirectionAndSpeedController', () => {
  let controller: WindDirectionAndSpeedController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WindDirectionAndSpeedController],
    }).compile();

    controller = module.get<WindDirectionAndSpeedController>(WindDirectionAndSpeedController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
