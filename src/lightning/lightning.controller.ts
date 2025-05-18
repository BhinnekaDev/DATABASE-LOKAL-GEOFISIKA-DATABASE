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

import { LightningService } from '@/lightning/lightning.service';
import { LightningQueryDto } from '@/lightning/dto/lightningQueryDto';
import { EditLightningDto } from '@/lightning/dto/edit-lightning.dto';
import { CreateLightningDto } from '@/lightning/dto/create-lightning.dto';
import { GetLightningQueryDto } from '@/lightning/dto/getLightningQueryDto';
import { FilterLightningByDateDto } from '@/lightning/dto/filterLightningByDateDto';
import { CreateLightningExcelDto } from '@/lightning/dto/create-lightning-excel.dto';

@ApiTags('Lightning')
@Controller('lightning')
export class LightningController {
  constructor(private readonly lightningService: LightningService) {}

  // Route untuk menambah data petir
  @Post('/insert')
  async saveLightning(
    @Req() req: Request,
    @Query('user_id') userId: string,
    @Body() dto: CreateLightningDto,
  ) {
    const ipAddress = req.ip as string;
    const userAgent = req.headers['user-agent'] as string;

    dto.user_id = userId;

    const result = await this.lightningService.saveLightning(
      dto,
      ipAddress,
      userAgent,
    );

    return result;
  }

  // Route untuk menyimpan data excel petir
  @Post('/insert-excel')
  async saveLightningExcel(
    @Req() req: Request,
    @Query('user_id') userId: string,
    @Body() dto: CreateLightningExcelDto,
  ) {
    const ipAddress = req.ip as string;
    const userAgent = req.headers['user-agent'] as string;

    dto.user_id = userId;

    const result = await this.lightningService.saveExcelLightning(
      dto,
      ipAddress,
      userAgent,
    );

    return result;
  }

  // Route untuk mengubah data petir
  @Put('/update')
  async updateLightning(
    @Req() req: Request,
    @Body() dto: EditLightningDto,
    @Query() querys: LightningQueryDto,
  ) {
    const ipAddress = req.ip as string;
    const userAgent = req.headers['user-agent'] as string;

    dto.user_id = querys.user_id;
    dto.id = querys.id;

    const result = await this.lightningService.updateLightning(
      dto,
      ipAddress,
      userAgent,
    );

    return result;
  }

  // Route untuk menghapus data petir
  @ApiOkResponse({ description: 'Berhasil menghapus data petir' })
  @Delete('/delete')
  async deleteLightning(
    @Req() req: Request,
    @Query() querys: LightningQueryDto,
  ) {
    const ipAddress = req.ip as string;
    const userAgent = req.headers['user-agent'] as string;

    return await this.lightningService.deleteLightning(
      querys.id,
      querys.user_id,
      ipAddress,
      userAgent,
    );
  }

  // Route untuk ambil semua data petir
  @ApiOkResponse({
    description: 'Berhasil mendapatkan semua data petir',
  })
  @Get('/get-all')
  async getAllLightning() {
    const result = await this.lightningService.getAllLightning();
    return result;
  }

  // Route untuk ambil data petir berdasarkan id
  @ApiOkResponse({
    description: 'Berhasil mendapatkan data petir berdasarkan id',
  })
  @Get('/get')
  async getLightning(@Query() querys: GetLightningQueryDto) {
    const result = await this.lightningService.getLightningById(querys.id);
    return result;
  }

  // Route untuk ambil data petir berdasarkan rentang tanggal
  @ApiOkResponse({
    description: 'Berhasil mendapatkan data petir berdasarkan rentang tanggal',
  })
  @Get('/get-by-date')
  async getLightningByDate(@Query() query: FilterLightningByDateDto) {
    return await this.lightningService.getLightningByDate(query);
  }
}
