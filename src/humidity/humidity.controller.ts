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

import { HumidityService } from '@/humidity/humidity.service';
import { HumidityQueryDto } from '@/humidity/dto/humidityQueryDto';
import { EditHumidityDto } from '@/humidity/dto/edit-humidity.dto';
import { CreateHumidityDto } from '@/humidity/dto/create-humidity.dto';
import { GetHumidityQueryDto } from '@/humidity/dto/getHumidityQueryDto';
import { FilterHumidityByDateDto } from '@/humidity/dto/filterHumidityByDateDto';

@ApiTags('Humidity')
@Controller('humidity')
export class HumidityController {
  constructor(private readonly humidityService: HumidityService) {}

  // Route untuk menambahkan data kelembapan
  @Post('/insert')
  async saveHumidity(
    @Req() req: Request,
    @Query('user_id') userId: string,
    @Body() dto: CreateHumidityDto,
  ) {
    const ipAddress = req.ip as string;
    const userAgent = req.headers['user-agent'] as string;

    dto.user_id = userId;

    const result = await this.humidityService.saveHumidity(
      dto,
      ipAddress,
      userAgent,
    );

    return result;
  }

  // Route untuk mengubah data kelembapan
  @Put('/update')
  async updateHumidity(
    @Req() req: Request,
    @Body() dto: EditHumidityDto,
    @Query() querys: HumidityQueryDto,
  ) {
    const ipAddress = req.ip as string;
    const userAgent = req.headers['user-agent'] as string;

    dto.user_id = querys.user_id;
    dto.id = querys.id;

    const result = await this.humidityService.updateHumidity(
      dto,
      ipAddress,
      userAgent,
    );
    return result;
  }

  // Route untuk menghapus data kelembapan
  @ApiOkResponse({ description: 'Berhasil menghapus data kelembapan' })
  @Delete('/delete')
  async deleteHumidity(@Req() req: Request, @Query() querys: HumidityQueryDto) {
    const ipAddress = req.ip as string;
    const userAgent = req.headers['user-agent'] as string;

    return await this.humidityService.deleteHumidity(
      querys.id,
      querys.user_id,
      ipAddress,
      userAgent,
    );
  }

  // Route untuk ambil semua data kelembapan
  @ApiOkResponse({ description: 'Berhasil mendapatkan semua data kelembapan' })
  @Get('/get-all')
  async getAllHumidity() {
    return await this.humidityService.getAllHumidity();
  }

  // Route untuk ambil semua data kelembapan berdasarkan id
  @ApiOkResponse({
    description: 'Berhasil mendapatkan data kelembapan berdasarkan id',
  })
  @Get('/get')
  async getHumidityById(@Query() querys: GetHumidityQueryDto) {
    const result = await this.humidityService.getHumidityById(querys.id);
    return result;
  }

  // Route untuk ambil data kelembapan berdasarkan rentang rata rata kelembapan
  @ApiOkResponse({
    description:
      'Berhasil mendapatkan data kelembapan berdasarkan rentang rata rata kelembapan',
  })
  @Get('/get-by-average')
  async getHumidityByDate(@Query() query: FilterHumidityByDateDto) {
    return await this.humidityService.getHumidityByDate(query);
  }
}
