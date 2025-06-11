import { Test, TestingModule } from '@nestjs/testing';
import { WindDirectionAndSpeedService } from './wind-direction-and-speed.service';

describe('WindDirectionAndSpeedService', () => {
  let service: WindDirectionAndSpeedService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WindDirectionAndSpeedService],
    }).compile();

    service = module.get<WindDirectionAndSpeedService>(WindDirectionAndSpeedService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
