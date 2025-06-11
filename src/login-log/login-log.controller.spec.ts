import { Test, TestingModule } from '@nestjs/testing';

import { LoginLogController } from '@/login-log/login-log.controller';

describe('LoginLogController', () => {
  let controller: LoginLogController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LoginLogController],
    }).compile();

    controller = module.get<LoginLogController>(LoginLogController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
