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

import { EarthquakeService } from '@/earthquake/earthquake.service';
import { EarthquakeQueryDto } from '@/earthquake/dto/earthquakeQueryDto';
import { EditEarthquakeDto } from '@/earthquake/dto/edit-earthquake.dto';
import { CreateEarthquakeDto } from '@/earthquake/dto/create-earthquake.dto';
import { GetEarthquakeQueryDto } from '@/earthquake/dto/getEarthquakeQueryDto';
import { FilterEarthquakeByDateDto } from '@/earthquake/dto/filterEarthquakeByDateDto';

@ApiTags('Earthquake')
@Controller('earthquake')
export class EarthquakeController {
  constructor(private readonly earthquakeService: EarthquakeService) {}

  // Route untuk menambah data gempa
  @Post('/insert')
  async saveEarthquake(
    @Req() req: Request,
    @Query('user_id') userId: string,
    @Body() dto: CreateEarthquakeDto,
  ) {
    const ipAddress = req.ip as string;
    const userAgent = req.headers['user-agent'] as string;

    dto.user_id = userId;

    const result = await this.earthquakeService.saveEarthquake(
      dto,
      ipAddress,
      userAgent,
    );

    return result;
  }

  // Route untuk mengubah data gempa
  @Put('/update')
  async updateEarthquake(
    @Req() req: Request,
    @Body() dto: EditEarthquakeDto,
    @Query() querys: EarthquakeQueryDto,
  ) {
    const ipAddress = req.ip as string;
    const userAgent = req.headers['user-agent'] as string;

    dto.user_id = querys.user_id;
    dto.id = querys.id;

    const result = await this.earthquakeService.updateEarthquake(
      dto,
      ipAddress,
      userAgent,
    );

    return result;
  }

  // Route untuk menghapus data gempa
  @ApiOkResponse({ description: 'Berhasil menghapus data gempa' })
  @Delete('/delete')
  async deleteEarthquake(
    @Req() req: Request,
    @Query() querys: EarthquakeQueryDto,
  ) {
    const ipAddress = req.ip as string;
    const userAgent = req.headers['user-agent'] as string;

    return await this.earthquakeService.deleteEarthquake(
      querys.id,
      querys.user_id,
      ipAddress,
      userAgent,
    );
  }

  // Route untuk ambil semua data gempa
  @ApiOkResponse({
    description: 'Berhasil mendapatkan semua data gempa',
  })
  @Get('/get-all')
  async getAllEarthquake() {
    const result = await this.earthquakeService.getAllEarthquake();
    return result;
  }

  // Route untuk ambil data gempa berdasarkan id
  @ApiOkResponse({
    description: 'Berhasil mendapatkan data gempa berdasarkan id',
  })
  @Get('/get')
  async getEarthquakeById(@Query() querys: GetEarthquakeQueryDto) {
    const result = await this.earthquakeService.getEarthquakeById(querys.id);
    return result;
  }

  // Route untuk ambil data gempa berdasarkan rentang tanggal
  @ApiOkResponse({
    description: 'Berhasil mendapatkan data gempa berdasarkan rentang tanggal',
  })
  @Get('/get-by-date')
  async getEarthquakeByDate(@Query() query: FilterEarthquakeByDateDto) {
    return await this.earthquakeService.getEarthquakeByDate(query);
  }
}
