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

import { AverageTemperatureService } from '@/average-temperature/average-temperature.service';
import { AverageTemperatureQueryDto } from '@/average-temperature/dto/averageTemperatureQueryDto';
import { EditAverageTemperatureDto } from '@/average-temperature/dto/edit-average-temperature.dto';
import { CreateAverageTemperatureDto } from '@/average-temperature/dto/create-average-temperature.dto';
import { GetAverageTemperatureQueryDto } from '@/average-temperature/dto/getAverageTemperatureQueryDto';

@ApiTags('Average Temperature')
@Controller('average-temperature')
export class AverageTemperatureController {
  constructor(
    private readonly averageTemperatureService: AverageTemperatureService,
  ) {}

  // Route untuk menambah data temperatur rata rata
  @Post('/insert')
  async saveAverageTemperature(
    @Req() req: Request,
    @Query('user_id') userId: string,
    @Body() dto: CreateAverageTemperatureDto,
  ) {
    const ipAddress = req.ip as string;
    const userAgent = req.headers['user-agent'] as string;

    dto.user_id = userId;

    const result = await this.averageTemperatureService.saveAverageTemperature(
      dto,
      ipAddress,
      userAgent,
    );

    return result;
  }

  // Route untuk mengubah data temperatur rata rata
  @Put('/update')
  async updateAverageTemperature(
    @Req() req: Request,
    @Body() dto: EditAverageTemperatureDto,
    @Query() querys: AverageTemperatureQueryDto,
  ) {
    const ipAddress = req.ip as string;
    const userAgent = req.headers['user-agent'] as string;

    dto.user_id = querys.user_id;
    dto.id = querys.id;

    const result =
      await this.averageTemperatureService.updateAverageTemperature(
        dto,
        ipAddress,
        userAgent,
      );

    return result;
  }

  // Route untuk menghapus data temperatur rata rata
  @ApiOkResponse({
    description: 'Berhasil menghapus data temperatur rata rata',
  })
  @Delete('/delete')
  async deleteAverageTemperature(
    @Req() req: Request,
    @Query() querys: AverageTemperatureQueryDto,
  ) {
    const ipAddress = req.ip as string;
    const userAgent = req.headers['user-agent'] as string;

    return await this.averageTemperatureService.deleteAverageTemperature(
      querys.id,
      querys.user_id,
      ipAddress,
      userAgent,
    );
  }

  // Route untuk ambil semua data temperatur rata rata
  @ApiOkResponse({
    description: 'Berhasil mendapatkan semua data temperatur rata rata',
  })
  @Get('/get-all')
  async getAllAverageTemperature() {
    const result =
      await this.averageTemperatureService.getAllAverageTemperature();
    return result;
  }

  // Route untuk ambil data temperatur rata rata berdasarkan id
  @ApiOkResponse({
    description:
      'Berhasil mendapatkan data temperatur rata rata berdasarkan id',
  })
  @Get('/get')
  async getAverageTemperatureById(
    @Query() querys: GetAverageTemperatureQueryDto,
  ) {
    const result =
      await this.averageTemperatureService.getAverageTemperatureById(querys.id);
    return result;
  }
}
