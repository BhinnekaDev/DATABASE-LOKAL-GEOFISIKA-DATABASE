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

import { TimeSignatureService } from '@/time-signature/time-signature.service';
import { TimeSignatureQueryDto } from '@/time-signature/dto/timeSignatureQueryDto';
import { EditTimeSignatureDto } from '@/time-signature/dto/edit-time-signature.dto';
import { CreateTimeSignatureDto } from '@/time-signature/dto/create-time-signature.dto';
import { GetTimeSignatureQueryDto } from '@/time-signature/dto/getTimeSignatureQueryDto';

@ApiTags('Time Signature')
@Controller('time-signature')
export class TimeSignatureController {
  constructor(private readonly timeSignatureService: TimeSignatureService) {}

  // Route untuk menambah data tanda waktu
  @Post('/insert')
  async saveTimeSignature(
    @Req() req: Request,
    @Query('user_id') userId: string,
    @Body() dto: CreateTimeSignatureDto,
  ) {
    const ipAddress = req.ip as string;
    const userAgent = req.headers['user-agent'] as string;

    dto.user_id = userId;

    const result = await this.timeSignatureService.saveTimeSignature(
      dto,
      ipAddress,
      userAgent,
    );

    return result;
  }

  // Route untuk mengubah data tanda waktu
  @Put('/update')
  async updateTimeSignature(
    @Req() req: Request,
    @Body() dto: EditTimeSignatureDto,
    @Query() querys: TimeSignatureQueryDto,
  ) {
    const ipAddress = req.ip as string;
    const userAgent = req.headers['user-agent'] as string;

    dto.user_id = querys.user_id;
    dto.id = querys.id;

    const result = await this.timeSignatureService.updateTimeSignature(
      dto,
      ipAddress,
      userAgent,
    );

    return result;
  }

  // Route untuk menghapus data tanda waktu
  @ApiOkResponse({ description: 'Berhasil menghapus data tanda waktu' })
  @Delete('/delete')
  async deleteTimeSignature(
    @Req() req: Request,
    @Query() querys: TimeSignatureQueryDto,
  ) {
    const ipAddress = req.ip as string;
    const userAgent = req.headers['user-agent'] as string;

    return await this.timeSignatureService.deleteTimeSignature(
      querys.id,
      querys.user_id,
      ipAddress,
      userAgent,
    );
  }

  // Route untuk ambil semua data tanda waktu
  @ApiOkResponse({
    description: 'Berhasil mendapatkan semua data tanda waktu',
  })
  @Get('/get-all')
  async getAllTimeSignature() {
    const result = await this.timeSignatureService.getAllTimeSignature();
    return result;
  }

  // Route untuk ambil data tanda waktu berdasarkan id
  @ApiOkResponse({
    description: 'Berhasil mendapatkan data tanda waktu berdasarkan id',
  })
  @Get('/get')
  async getMinTemperatureById(@Query() querys: GetTimeSignatureQueryDto) {
    const result = await this.timeSignatureService.getTimeSignatureById(
      querys.id,
    );
    return result;
  }
}
