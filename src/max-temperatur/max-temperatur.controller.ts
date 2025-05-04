import { Request } from 'express';
import { ApiTags, ApiOkResponse } from '@nestjs/swagger';
import {
  Req,
  Get,
  Put,
  Post,
  Body,
  Param,
  Delete,
  Controller,
} from '@nestjs/common';

import { MaxTemperaturService } from '@/max-temperatur/max-temperatur.service';
import { CreateMaxTemperatureDto } from '@/max-temperatur/dto/create-max-temperature.dto';

@ApiTags('Max Temperatur')
@Controller('max-temperatur')
export class MaxTemperaturController {
  constructor(private readonly maxTemperaturService: MaxTemperaturService) {}

  // Route untuk menambahkan data max temperatur
  @Post(`/insert/:user_id`)
  create(
    @Req() req: Request,
    @Param() param: CreateMaxTemperatureDto,
    @Body() dto: CreateMaxTemperatureDto,
  ) {
    const ipAddress = req.ip as string;
    const userAgent = req.headers['user-agent'] as string;
    dto.user_id = param.user_id;

    const result = this.maxTemperaturService.saveMaxTemperature(
      dto,
      ipAddress,
      userAgent,
    );
    return result;
  }
}
