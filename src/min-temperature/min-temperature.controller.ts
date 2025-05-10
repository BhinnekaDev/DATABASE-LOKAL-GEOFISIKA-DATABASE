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

import { MinTemperatureService } from '@/min-temperature/min-temperature.service';
import { MinTemperatureQueryDto } from '@/min-temperature/dto/minTemperatureQueryDto';
import { EditMinTemperatureDto } from '@/min-temperature/dto/edit-min-temperature.dto';
import { CreateMinTemperatureDto } from '@/min-temperature/dto/create-min-temperature.dto';
import { GetMinTemperatureQueryDto } from '@/min-temperature/dto/getMinTemperatureQueryDto';
import { FilterMinTemperatureByDateDto } from '@/min-temperature/dto/filterMinTemperatureByDateDto';

@ApiTags('Min Temperatue')
@Controller('min-temperature')
export class MinTemperatureController {
  constructor(private readonly minTemperatureService: MinTemperatureService) {}

  // Route untuk menambah data temperatur minimal
  @Post('/insert')
  async saveMinTemperature(
    @Req() req: Request,
    @Query('user_id') userId: string,
    @Body() dto: CreateMinTemperatureDto,
  ) {
    const ipAddress = req.ip as string;
    const userAgent = req.headers['user-agent'] as string;

    dto.user_id = userId;

    const result = await this.minTemperatureService.saveMinTemperature(
      dto,
      ipAddress,
      userAgent,
    );

    return result;
  }

  // Route untuk mengubah data temperatur minimal
  @Put('/update')
  async updateMinTemperature(
    @Req() req: Request,
    @Body() dto: EditMinTemperatureDto,
    @Query() querys: MinTemperatureQueryDto,
  ) {
    const ipAddress = req.ip as string;
    const userAgent = req.headers['user-agent'] as string;

    dto.user_id = querys.user_id;
    dto.id = querys.id;

    const result = await this.minTemperatureService.updateMinTemperature(
      dto,
      ipAddress,
      userAgent,
    );

    return result;
  }

  // Route untuk menghapus data temperatur minimal
  @ApiOkResponse({ description: 'Berhasil menghapus data temperatur minimal' })
  @Delete('/delete')
  async deleteMinTemperature(
    @Req() req: Request,
    @Query() querys: MinTemperatureQueryDto,
  ) {
    const ipAddress = req.ip as string;
    const userAgent = req.headers['user-agent'] as string;

    return await this.minTemperatureService.deleteMinTemperature(
      querys.id,
      querys.user_id,
      ipAddress,
      userAgent,
    );
  }

  // Route untuk ambil semua data temperatur minimal
  @ApiOkResponse({
    description: 'Berhasil mendapatkan semua data temperatur minimal',
  })
  @Get('/get-all')
  async getAllMinTemperature() {
    const result = await this.minTemperatureService.getAllMinTemperature();
    return result;
  }

  // Route untuk ambil data temperatur minimal berdasarkan id
  @ApiOkResponse({
    description: 'Berhasil mendapatkan data temperatur minimal berdasarkan id',
  })
  @Get('/get')
  async getMinTemperatureById(@Query() querys: GetMinTemperatureQueryDto) {
    const result = await this.minTemperatureService.getMinTemperatureById(
      querys.id,
    );
    return result;
  }

  // Route untuk ambil data temperatur minimal berdasarkan rentang tanggal
  @ApiOkResponse({
    description:
      'Berhasil mendapatkan data temperatur minimal berdasarkan rentang tanggal',
  })
  @Get('/get-by-date')
  async getMinTemperatureByDate(@Query() query: FilterMinTemperatureByDateDto) {
    return await this.minTemperatureService.getMinTemperatureByDate(query);
  }
}
