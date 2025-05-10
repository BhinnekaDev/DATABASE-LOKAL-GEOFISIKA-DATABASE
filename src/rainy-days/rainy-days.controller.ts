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

import { RainyDaysService } from '@/rainy-days/rainy-days.service';
import { RainyDaysQueryDto } from '@/rainy-days/dto/rainyDaysQueryDto';
import { EditRainyDaysDto } from '@/rainy-days/dto/edit-rainy-days.dto';
import { CreateRainyDaysDto } from '@/rainy-days/dto/create-rainy-days.dto';
import { GetRainyDaysQueryDto } from '@/rainy-days/dto/getRainyDaysQueryDto';
import { FilterRainyDaysByDateDto } from '@/rainy-days/dto/filterRainyDaysByDateDto';

@ApiTags('Rainy Days')
@Controller('rainy-days')
export class RainyDaysController {
  constructor(private readonly rainyDaysService: RainyDaysService) {}

  // Route untuk menambah data hari hujan
  @Post('/insert')
  async saveRainyDays(
    @Req() req: Request,
    @Query('user_id') userId: string,
    @Body() dto: CreateRainyDaysDto,
  ) {
    const ipAddress = req.ip as string;
    const userAgent = req.headers['user-agent'] as string;

    dto.user_id = userId;

    const result = await this.rainyDaysService.saveRainyDays(
      dto,
      ipAddress,
      userAgent,
    );

    return result;
  }

  // Route untuk mengubah data hari hujan
  @Put('/update')
  async updateRainyDays(
    @Req() req: Request,
    @Body() dto: EditRainyDaysDto,
    @Query() querys: RainyDaysQueryDto,
  ) {
    const ipAddress = req.ip as string;
    const userAgent = req.headers['user-agent'] as string;

    dto.user_id = querys.user_id;
    dto.id = querys.id;

    return this.rainyDaysService.updateRainyDays(dto, ipAddress, userAgent);
  }

  // Route untuk menghapus data hari hujan
  @ApiOkResponse({ description: 'Berhasil menghapus data hari hujan' })
  @Delete('/delete')
  async deleteRainyDays(
    @Req() req: Request,
    @Query() querys: RainyDaysQueryDto,
  ) {
    const ipAddress = req.ip as string;
    const userAgent = req.headers['user-agent'] as string;

    return await this.rainyDaysService.deleteRainyDays(
      querys.id,
      querys.user_id,
      ipAddress,
      userAgent,
    );
  }

  // Route untuk ambil semua data hari hujan
  @ApiOkResponse({
    description: 'Berhasil mendapatkan semua data hari hujan',
  })
  @Get(`/get-all`)
  async getAllRainyDays() {
    const result = await this.rainyDaysService.getAllRainyDays();
    return result;
  }

  // Route untuk ambil data hari hujan minimal berdasarkan id
  @ApiOkResponse({
    description: 'Berhasil mendapatkan data hari hujan berdasarkan id',
  })
  @Get(`/get`)
  async getRainyDaysById(@Query() querys: GetRainyDaysQueryDto) {
    const result = await this.rainyDaysService.getRainyDaysById(querys.id);
    return result;
  }

  // Route untuk ambil data hari hujan berdasarkan rentang tanggal
  @ApiOkResponse({
    description:
      'Berhasil mendapatkan data hari hujan berdasarkan rentang tanggal',
  })
  @Get('/get-by-date')
  async getRainyDaysByDate(@Query() query: FilterRainyDaysByDateDto) {
    return await this.rainyDaysService.getRainyDaysByDate(query);
  }
}
