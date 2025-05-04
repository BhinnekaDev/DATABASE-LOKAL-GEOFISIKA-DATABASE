import { ApiExcludeEndpoint } from '@nestjs/swagger';
import { Controller, Post, Body } from '@nestjs/common';

import { ActivityLogService } from '@/activity-log/activity-log.service';
import { CreateActivityLogDto } from '@/activity-log/dto/create-activity-log.dto';

@Controller('activity-log')
export class ActivityLogController {
  constructor(private readonly activityLogService: ActivityLogService) {}

  @ApiExcludeEndpoint()
  @Post()
  async createLog(@Body() dto: CreateActivityLogDto) {
    return await this.activityLogService.logActivity(dto);
  }
}
