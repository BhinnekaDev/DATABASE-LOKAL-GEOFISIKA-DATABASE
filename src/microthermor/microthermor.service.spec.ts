import { Test, TestingModule } from '@nestjs/testing';
import { MicrothermorService } from './microthermor.service';

describe('MicrothermorService', () => {
  let service: MicrothermorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MicrothermorService],
    }).compile();

    service = module.get<MicrothermorService>(MicrothermorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
