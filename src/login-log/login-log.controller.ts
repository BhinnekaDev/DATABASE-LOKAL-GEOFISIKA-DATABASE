import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOkResponse, ApiExcludeEndpoint } from '@nestjs/swagger';

import { LoginLogService } from '@/login-log/login-log.service';
import { CreateLoginLogDto } from '@/login-log/dto/create-login-log.dto';

@ApiTags('Login Log')
@Controller('login-log')
export class LoginLogController {
  constructor(private readonly loginLogService: LoginLogService) {}

  // Route untuk simpan login log
  @ApiExcludeEndpoint()
  @Post()
  async createLog(@Body() dto: CreateLoginLogDto) {
    return await this.loginLogService.logLogin(dto);
  }

  // Route untuk mendapatkan semua login log
  @ApiOkResponse({ description: 'Berhasil mendapatkan semua login log' })
  @Get()
  async getAllLog() {
    return await this.loginLogService.getAllLoginLog();
  }

  // Route untuk mendapatkan login log berdasarkan user_id
  @ApiOkResponse({
    description: 'Berhasil mendapatkan login log berdasarkan user_id',
  })
  @Get(':user_id')
  async getLogByUserId(@Param('user_id') user_id: string) {
    return await this.loginLogService.getLoginLogByUserId(user_id);
  }
}
