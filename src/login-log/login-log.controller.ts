import { ApiExcludeEndpoint } from '@nestjs/swagger';
import { Controller, Post, Body } from '@nestjs/common';
import { LoginLogService } from '@/login-log/login-log.service';
import { CreateLoginLogDto } from '@/login-log/dto/create-login-log.dto';
@Controller('login-log')
export class LoginLogController {
  constructor(private readonly loginLogService: LoginLogService) {}

  @ApiExcludeEndpoint()
  @Post()
  async createLog(@Body() dto: CreateLoginLogDto) {
    return await this.loginLogService.logLogin(dto);
  }
}
