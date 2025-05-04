import { Request } from 'express';
import { ApiTags, ApiOkResponse } from '@nestjs/swagger';
import {
  Req,
  Get,
  Put,
  Post,
  Body,
  Param,
  Delete,
  Controller,
} from '@nestjs/common';

import { EvaporationService } from '@/evaporation/evaporation.service';
import { EditEvaporationDto } from '@/evaporation/dto/edit-evaporation.dto';
import { CreateEvaporationDto } from '@/evaporation/dto/create-evaporation.dto';

@ApiTags('Evaporation')
@Controller('evaporation')
export class EvaporationController {
  constructor(private readonly evaporationService: EvaporationService) {}

  // Route untuk menyimpan data evaporation
  @Post('/insert/:user_id')
  async saveEvaporation(
    @Req() req: Request,
    @Param() param: CreateEvaporationDto,
    @Body() dto: CreateEvaporationDto,
  ) {
    const ipAddress = req.ip as string;
    const userAgent = req.headers['user-agent'] as string;
    dto.user_id = param.user_id;

    const result = await this.evaporationService.saveEvaporation(
      dto,
      ipAddress,
      userAgent,
    );
    return result;
  }

  // Route untuk mengubah data evaporation
  @Put('/update/:id_date/:user_id')
  async updateEvaporation(
    @Req() req: Request,
    @Body() dto: EditEvaporationDto,
    @Param() param: { id_date: string; user_id: string },
  ) {
    const ipAddress = req.ip as string;
    const userAgent = req.headers['user-agent'] as string;

    dto.user_id = param.user_id;
    dto.id_date = parseInt(param.id_date);

    const result = await this.evaporationService.updateEvaporation(
      dto,
      ipAddress,
      userAgent,
    );
    return result;
  }

  // Route untuk menghapus data evaporation
  @Delete('/delete/:id_date/:user_id')
  async deleteEvaporation(
    @Req() req: Request,
    @Param('id_date') id_date: string,
    @Param('user_id') user_id: string,
  ) {
    const ipAddress = req.ip as string;
    const userAgent = req.headers['user-agent'] as string;

    return await this.evaporationService.deleteEvaporation(
      parseInt(id_date),
      user_id,
      ipAddress,
      userAgent,
    );
  }

  //   Route untuk ambil semua data evaporation
  @ApiOkResponse({ description: 'Berhasil mendapatkan data' })
  @Get('/get')
  async getAllEvaporation() {
    return await this.evaporationService.getAllEvaporation();
  }

  // Route untuk ambil semua data evaporation berdasarkan id
  @ApiOkResponse({ description: 'Berhasil mendapatkan data berdasarkan id' })
  @Get('/get/:id')
  async getEvaporationById(@Param('id') id: string) {
    const result = await this.evaporationService.getEvaporationById(
      parseInt(id),
    );
    return result;
  }
}
