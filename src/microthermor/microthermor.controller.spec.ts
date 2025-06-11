import { Test, TestingModule } from '@nestjs/testing';
import { MicrothermorController } from './microthermor.controller';

describe('MicrothermorController', () => {
  let controller: MicrothermorController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MicrothermorController],
    }).compile();

    controller = module.get<MicrothermorController>(MicrothermorController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
