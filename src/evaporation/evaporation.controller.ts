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

import { EvaporationService } from '@/evaporation/evaporation.service';
import { EditEvaporationDto } from '@/evaporation/dto/edit-evaporation.dto';
import { EvaporationQueryDto } from '@/evaporation/dto/qevaporationQueryDto';
import { CreateEvaporationDto } from '@/evaporation/dto/create-evaporation.dto';
import { GetEvaporationQueryDto } from '@/evaporation/dto/getEvaporationQueryDto';

@ApiTags('Evaporation')
@Controller('evaporation')
export class EvaporationController {
  constructor(private readonly evaporationService: EvaporationService) {}

  // Route untuk menyimpan data evaporation
  @Post('/insert')
  async saveEvaporation(
    @Req() req: Request,
    @Query('user_id') userId: string,
    @Body() dto: CreateEvaporationDto,
  ) {
    const ipAddress = req.ip as string;
    const userAgent = req.headers['user-agent'] as string;
    dto.user_id = userId;

    const result = await this.evaporationService.saveEvaporation(
      dto,
      ipAddress,
      userAgent,
    );
    return result;
  }

  // Route untuk mengubah data evaporation
  @Put('/update')
  async updateEvaporation(
    @Req() req: Request,
    @Body() dto: EditEvaporationDto,
    @Query() querys: EvaporationQueryDto,
  ) {
    const ipAddress = req.ip as string;
    const userAgent = req.headers['user-agent'] as string;

    dto.user_id = querys.user_id;
    dto.id = querys.id;

    const result = await this.evaporationService.updateEvaporation(
      dto,
      ipAddress,
      userAgent,
    );
    return result;
  }

  // Route untuk menghapus data evaporation
  @ApiOkResponse({ description: 'Berhasil menghapus data penguapan' })
  @Delete('/delete')
  async deleteEvaporation(
    @Req() req: Request,
    @Query() querys: EvaporationQueryDto,
  ) {
    const ipAddress = req.ip as string;
    const userAgent = req.headers['user-agent'] as string;

    return await this.evaporationService.deleteEvaporation(
      querys.id,
      querys.user_id,
      ipAddress,
      userAgent,
    );
  }

  //   Route untuk ambil semua data evaporation
  @ApiOkResponse({ description: 'Berhasil mendapatkan semua data penguapan' })
  @Get('/get-all')
  async getAllEvaporation() {
    return await this.evaporationService.getAllEvaporation();
  }

  // Route untuk ambil semua data evaporation berdasarkan id
  @ApiOkResponse({
    description: 'Berhasil mendapatkan data penguapan berdasarkan id',
  })
  @Get('/get')
  async getEvaporationById(@Query() querys: GetEvaporationQueryDto) {
    const result = await this.evaporationService.getEvaporationById(querys.id);
    return result;
  }
}
