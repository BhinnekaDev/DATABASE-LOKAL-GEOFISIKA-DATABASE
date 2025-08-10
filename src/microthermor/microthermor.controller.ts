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

import { MicrothermorService } from '@/microthermor/microthermor.service';
import { EditMicrothermorDto } from '@/microthermor/dto/edit-microthermor.dto';
import { MicrothermorQueryDto } from '@/microthermor/dto/microthermorQueryDto';
import { CreateMicrothermorDto } from '@/microthermor/dto/create-microthermor.dto';
import { GetMicrothermorQueryDto } from '@/microthermor/dto/getMicrothermorQueryDto';
import { GetMicrothermorQueryByMinMaxTDOMDto } from '@/microthermor/dto/getMicrothermorQueryByMinMaxTDOMDto';

@ApiTags('Microthermor')
@Controller('microthermor')
export class MicrothermorController {
  constructor(private readonly microthermorService: MicrothermorService) {}

  // Route untuk menyimpan data mikrotremor
  @Post('/insert')
  async saveMicrothermor(
    @Req() req: Request,
    @Query('user_id') userId: string,
    @Body() dto: CreateMicrothermorDto,
  ) {
    const ipAddress = req.ip as string;
    const userAgent = req.headers['user-agent'] as string;
    dto.user_id = userId;

    const result = await this.microthermorService.saveMicrothermor(
      dto,
      ipAddress,
      userAgent,
    );
    return result;
  }

  // Route untuk mengubah data mikrotremor
  @Put('/update')
  async updateMicrothermor(
    @Req() req: Request,
    @Body() dto: EditMicrothermorDto,
    @Query() querys: MicrothermorQueryDto,
  ) {
    const ipAddress = req.ip as string;
    const userAgent = req.headers['user-agent'] as string;

    dto.user_id = querys.user_id;
    dto.id = querys.id;

    const result = await this.microthermorService.updateMicrothermor(
      dto,
      ipAddress,
      userAgent,
    );
    return result;
  }

  // Route untuk menghapus data mikrotremor
  @ApiOkResponse({ description: 'Berhasil menghapus data mikrotremor' })
  @Delete('/delete')
  async deleteMicrothermor(
    @Req() req: Request,
    @Query() querys: MicrothermorQueryDto,
  ) {
    const ipAddress = req.ip as string;
    const userAgent = req.headers['user-agent'] as string;

    return await this.microthermorService.deleteMicrothermor(
      querys.id,
      querys.user_id,
      ipAddress,
      userAgent,
    );
  }

  // Route untuk ambil semua data mikrotremor
  @ApiOkResponse({ description: 'Berhasil mendapatkan semua data mikrotremor' })
  @Get('/get-all')
  async getAllMicrothermor() {
    return await this.microthermorService.getAllMicrothermor();
  }

  // Route untuk ambil semua data mikrotremor berdasarkan id
  @ApiOkResponse({
    description: 'Berhasil mendapatkan data mikrotremor berdasarkan id',
  })
  @Get('/get')
  async getMicrothermorById(@Query() querys: GetMicrothermorQueryDto) {
    const result = await this.microthermorService.getMicrothermorById(
      querys.id,
    );
    return result;
  }

  // Route untuk ambil semua data mikrotremor berdasarkan TDOM
  @ApiOkResponse({
    description: 'Berhasil mendapatkan data mikrotremor berdasarkan TDOM',
  })
  @Get('/get-by-TDOM')
  async getMicrothermorByMaxMinTDOM(
    @Query() query: GetMicrothermorQueryByMinMaxTDOMDto,
  ) {
    const result =
      await this.microthermorService.getMicrothermorByMaxMinTDOM(query);
    return result;
  }
}
