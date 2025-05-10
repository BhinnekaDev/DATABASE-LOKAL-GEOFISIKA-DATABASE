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
import { FilterRainfallByDateDto } from '@/rainfall/dto/filterRainfallByDateDto';

@ApiTags('Rainfall')
@Controller('rainfall')
export class RainfallController {
  constructor(private readonly rainfallService: RainfallService) {}

  // Route untuk menambah data curah hujan
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

  // Route untuk mengubah data curah hujan
  @Put('/update')
  async updateRainfall(
    @Req() req: Request,
    @Body() dto: EditRainfallDto,
    @Query() querys: RainfallQueryDto,
  ) {
    const ipAddress = req.ip as string;
    const userAgent = req.headers['user-agent'] as string;

    dto.user_id = querys.user_id;
    dto.id = querys.id;

    const result = await this.rainfallService.updateRainfall(
      dto,
      ipAddress,
      userAgent,
    );

    return result;
  }

  // Route untuk menghapus data curah hujan
  @ApiOkResponse({ description: 'Berhasil menghapus data curah hujan' })
  @Delete('/delete')
  async deleteRainfall(@Req() req: Request, @Query() querys: RainfallQueryDto) {
    const ipAddress = req.ip as string;
    const userAgent = req.headers['user-agent'] as string;

    return await this.rainfallService.deleteRainfall(
      querys.id,
      querys.user_id,
      ipAddress,
      userAgent,
    );
  }

  // Route untuk ambil semua data curah hujan
  @ApiOkResponse({
    description: 'Berhasil mendapatkan semua data curah hujan',
  })
  @Get('/get-all')
  async getAllRainfall() {
    const result = await this.rainfallService.getAllRainfall();
    return result;
  }

  // Route untuk ambil data curah hujan berdasarkan id
  @ApiOkResponse({
    description: 'Berhasil mendapatkan data curah hujan berdasarkan id',
  })
  @Get('/get')
  async getRainfallById(@Query() querys: GetRainfallQueryDto) {
    const result = await this.rainfallService.getRainfallById(querys.id);
    return result;
  }

  // Route untuk ambil data curah hujan berdasarkan rentang tanggal
  @ApiOkResponse({
    description:
      'Berhasil mendapatkan data curah hujan berdasarkan rentang tanggal',
  })
  @Get('/get-by-date')
  async getRainfallByDate(@Query() query: FilterRainfallByDateDto) {
    return await this.rainfallService.getRainfallByDate(query);
  }
}
