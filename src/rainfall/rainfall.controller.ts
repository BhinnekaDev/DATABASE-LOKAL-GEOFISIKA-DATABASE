import { Request } from 'express';
import { ApiTags, ApiOkResponse } from '@nestjs/swagger';
import {
  Req,
  Get,
  Put,
  Post,
  Body,
  Query,
  Delete,
  Controller,
} from '@nestjs/common';

import { RainfallService } from '@/rainfall/rainfall.service';
import { RainfallQueryDto } from '@/rainfall/dto/rainfallQueryDto';
import { EditRainfallDto } from '@/rainfall/dto/edit-rainfall.dto';
import { CreateRainfallDto } from '@/rainfall/dto/create-rainfall.dto';
import { GetRainfallQueryDto } from '@/rainfall/dto/getRainfallQueryDto';

@ApiTags('Rainfall')
@Controller('rainfall')
export class RainfallController {
  constructor(private readonly rainfallService: RainfallService) {}

  // Route untuk menambah data curah hujan
  @ApiOkResponse()
  @Post('/insert')
  async saveRainfall(
    @Req() req: Request,
    @Query('user_id') userId: string,
    @Body() dto: CreateRainfallDto,
  ) {
    const ipAddress = req.ip as string;
    const userAgent = req.headers['user-agent'] as string;

    dto.user_id = userId;

    const result = await this.rainfallService.saveRainfall(
      dto,
      ipAddress,
      userAgent,
    );

    return result;
  }
}
