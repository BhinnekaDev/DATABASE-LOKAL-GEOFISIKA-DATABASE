import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOkResponse, ApiExcludeEndpoint } from '@nestjs/swagger';

import { ActivityLogService } from '@/activity-log/activity-log.service';
import { CreateActivityLogDto } from '@/activity-log/dto/create-activity-log.dto';

@ApiTags('Activity Log')
@Controller('activity-log')
export class ActivityLogController {
  constructor(private readonly activityLogService: ActivityLogService) {}

  // Route untuk membuat log aktivitas
  @ApiExcludeEndpoint()
  @Post()
  async createLog(@Body() dto: CreateActivityLogDto) {
    return await this.activityLogService.logActivity(dto);
  }

  // Route untuk mendapatkan semua log aktivitas
  @Get(`/get`)
  @ApiOkResponse({ description: 'Berhasil Menampilkan semua log aktivitas' })
  async getAllLog() {
    return await this.activityLogService.getAllActivityLog();
  }

  // Route untuk mendapatkan log aktivitas berdasarkan user_id
  @Get('/get/:user_id')
  @ApiOkResponse({
    description: 'Berhasil Menampilkan log aktivitas berdasarkan admin_id',
  })
  async getLogByUserId(@Param('user_id') user_id: string) {
    return await this.activityLogService.getActivityLogByUserId(user_id);
  }
}
