import { Test, TestingModule } from '@nestjs/testing';
import { RainGaugeService } from './rain-gauge.service';

describe('RainGaugeService', () => {
  let service: RainGaugeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RainGaugeService],
    }).compile();

    service = module.get<RainGaugeService>(RainGaugeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
