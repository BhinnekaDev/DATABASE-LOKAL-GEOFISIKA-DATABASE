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

import { MaxTemperatureService } from '@/max-temperature/max-temperature.service';
import { EditMaxTemperatureDto } from '@/max-temperature/dto/edit-max-temperature.dto';
import { CreateMaxTemperatureDto } from '@/max-temperature/dto/create-max-temperature.dto';

@ApiTags('Max Temperature')
@Controller('max-temperature')
export class MaxTemperatureController {
  constructor(private readonly maxTemperatureService: MaxTemperatureService) {}

  // Route untuk menambahkan data max temperatur
  @Post('/insert')
  async saveMaxTemperature(
    @Req() req: Request,
    @Query('user_id') userId: string,
    @Body() dto: CreateMaxTemperatureDto,
  ) {
    const ipAddress = req.ip as string;
    const userAgent = req.headers['user-agent'] as string;

    dto.user_id = userId;

    const result = await this.maxTemperatureService.saveMaxTemperature(
      dto,
      ipAddress,
      userAgent,
    );

    return result;
  }

  // Route untuk mengubah data max temperatur
  @Put(`/update`)
  async updateMaxTemperature(
    @Req() req: Request,
    @Body() dto: EditMaxTemperatureDto,
    @Query() querys: { id: number; user_id: string },
  ) {
    const ipAddress = req.ip as string;
    const userAgent = req.headers['user-agent'] as string;

    dto.user_id = querys.user_id;
    dto.id = querys.id;

    const result = await this.maxTemperatureService.updateMaxTemperature(
      dto,
      ipAddress,
      userAgent,
    );
    return result;
  }

  // Route untuk menghapus data max temperatur
  @Delete(`/delete`)
  async deleteMaxTemperature(
    @Req() req: Request,
    @Query() querys: { id: number; user_id: string },
  ) {
    const ipAddress = req.ip as string;
    const userAgent = req.headers['user-agent'] as string;

    const result = await this.maxTemperatureService.deleteMaxTemperature(
      querys.id,
      querys.user_id,

      ipAddress,
      userAgent,
    );
    return result;
  }

  // Route untuk ambil semua data temperatur maksimal
  @ApiOkResponse({
    description: 'Berhasil mendapatkan semua data temperatur maksimal',
  })
  @Get('/get-all')
  async getAllMaxTemperature() {
    const result = await this.maxTemperatureService.getAllMaxTemperature();
    return result;
  }

  // Route untuk ambil data temperatur maksimal berdasarkan id
  @ApiOkResponse({
    description: 'Berhasil mendapatkan data temperatur maksimal berdasarkan id',
  })
  @Get('/get')
  async getMaxTemperatureById(@Query() querys: { id: number }) {
    const result = await this.maxTemperatureService.getMaxTemperatureById(
      querys.id,
    );
    return result;
  }
}
