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

import { RainGaugeService } from '@/rain-gauge/rain-gauge.service';
import { RainGaugeQueryDto } from '@/rain-gauge/dto/rainGaugeQueryDto';
import { EditRainGaugeDto } from '@/rain-gauge/dto/edit-rain-gauge.dto';
import { FilterRainGaugeDto } from '@/rain-gauge/dto/filter-rain-gauge.dto';
import { CreateRainGaugeDto } from '@/rain-gauge/dto/create-rain-gauge.dto';
import { GetRainGaugeQueryDto } from '@/rain-gauge/dto/getRainGaugeQueryDto';
import { EditRainGaugeQueryDto } from '@/rain-gauge/dto/edit-rain-gauge-query.dto';
import { FilterRainGaugeByDateDto } from '@/rain-gauge/dto/filterRainGaugeByDateDto';
import { CreateRainGaugeExcelDto } from '@/rain-gauge/dto/create-rain-gauge-excel.dto';
import { CreateRainGaugeQueryDto } from '@/rain-gauge/dto/create-rain-gauge-query.dto';
import { CreateRainGaugeQueryExcelDto } from '@/rain-gauge/dto/create-rain-gauge-query-excel-dto';

@ApiTags('Rain Gauge')
@Controller('rain-gauge')
export class RainGaugeController {
  constructor(private readonly rainGaugeService: RainGaugeService) {}

  @Post('/insert')
  async saveRainGauge(
    @Req() req: Request,
    @Query() dtoQuery: CreateRainGaugeQueryDto,
    @Body() dto: CreateRainGaugeDto,
  ) {
    const ipAddress = req.ip as string;
    const userAgent = req.headers['user-agent'] as string;

    const result = await this.rainGaugeService.saveRainGauge(
      dto,
      dtoQuery,
      ipAddress,
      userAgent,
    );

    return result;
  }

  // Route untuk menyimpan data excel data pos hujan
  @Post('/insert-excel')
  async saveExcelRainGauge(
    @Req() req: Request,
    @Query() dtoQuery: CreateRainGaugeQueryExcelDto,
    @Body() dto: CreateRainGaugeExcelDto,
  ) {
    const ipAddress = req.ip as string;
    const userAgent = req.headers['user-agent'] as string;

    const result = await this.rainGaugeService.saveExcelRainGauge(
      dto,
      dtoQuery,
      ipAddress,
      userAgent,
    );

    return result;
  }

  // Route untuk mengubah data pos
  @Put('/update')
  async updateRainGauge(
    @Req() req: Request,
    @Query() dtoQuery: EditRainGaugeQueryDto,
    @Body() dto: EditRainGaugeDto,
  ) {
    const ipAddress = req.ip as string;
    const userAgent = req.headers['user-agent'] as string;

    const result = await this.rainGaugeService.updateRainGauge(
      dto,
      dtoQuery,
      ipAddress,
      userAgent,
    );

    return result;
  }

  // Route untuk menghapus data pos hujan
  @ApiOkResponse({ description: 'Berhasil menghapus data pos hujan' })
  @Delete('/delete')
  async deleteRainGauge(
    @Req() req: Request,
    @Query() querys: RainGaugeQueryDto,
  ) {
    const ipAddress = req.ip as string;
    const userAgent = req.headers['user-agent'] as string;

    return await this.rainGaugeService.deleteRainGauge(
      querys.id,
      querys.user_id,
      ipAddress,
      userAgent,
    );
  }

  // Route untuk ambil data pos hujan berdasarkan id
  @ApiOkResponse({
    description: 'Berhasil mendapatkan data pos hujan berdasarkan id',
  })
  @Get('/get-by-id')
  async getRainGaugeById(@Query() query: GetRainGaugeQueryDto) {
    const result = await this.rainGaugeService.getRainGaugeById(query);
    return result;
  }

  // Route untuk ambil data pos hujan berdasarkan rentang tanggal
  @ApiOkResponse({
    description:
      'Berhasil mendapatkan data pos hujan berdasarkan rentang tanggal',
  })
  @Get('/get-by-date')
  async getRainGaugeByDate(@Query() query: FilterRainGaugeByDateDto) {
    return await this.rainGaugeService.getRainGaugeByDate(query);
  }

  // Route untuk ambil data pos hujan berdasarkan kota dan/atau desa
  @ApiOkResponse({
    description:
      'Berhasil mendapatkan data pos hujan berdasarkan kota dan/atau desa',
  })
  @Get('/get-by-city-village')
  async getRainGaugeByCityVillage(@Query() query: FilterRainGaugeDto) {
    return await this.rainGaugeService.getRainGaugeByCityVillage(query);
  }
}
