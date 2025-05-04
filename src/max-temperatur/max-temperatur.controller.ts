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
import { EditMaxTemperatureDto } from '@/max-temperatur/dto/edit-max-temperature.dto';
import { CreateMaxTemperatureDto } from '@/max-temperatur/dto/create-max-temperature.dto';

@ApiTags('Max Temperatur')
@Controller('max-temperatur')
export class MaxTemperaturController {
  constructor(private readonly maxTemperaturService: MaxTemperaturService) {}

  // Route untuk menambahkan data max temperatur
  @Post(`/insert/:user_id`)
  async saveMaxTemperature(
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

  // Route untuk mengubah data max temperatur
  @Put(`/update/:id_date/:user_id`)
  async updateMaxTemperature(
    @Req() req: Request,
    @Body() dto: EditMaxTemperatureDto,
    @Param() param: { id_date: string; user_id: string },
  ) {
    const ipAddress = req.ip as string;
    const userAgent = req.headers['user-agent'] as string;

    dto.user_id = param.user_id;
    dto.id_date = parseInt(param.id_date);

    const result = await this.maxTemperaturService.updateMaxTemperature(
      dto,
      ipAddress,
      userAgent,
    );
    return result;
  }
}
