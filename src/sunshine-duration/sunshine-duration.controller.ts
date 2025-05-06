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

import { SunshineDurationService } from '@/sunshine-duration/sunshine-duration.service';
import { SunshineDurationQueryDto } from '@/sunshine-duration/dto/sunshineDurationQueryDto';
import { EditSunshineDurationDto } from '@/sunshine-duration/dto/edit-sunshine-duration.dto';
import { CreateSunshineDurationDto } from '@/sunshine-duration/dto/create-sunshine-duration.dto';
import { GetSunshineDurationQueryDto } from '@/sunshine-duration/dto/getSunshineDurationQueryDto';

@ApiTags('Sunshine Duration')
@Controller('sunshine-duration')
export class SunshineDurationController {
  constructor(
    private readonly sunshineDurationService: SunshineDurationService,
  ) {}

  // Route untuk menambah data durasi matahari terbit
  @Post('/insert')
  async saveSunshineDuration(
    @Req() req: Request,
    @Query('user_id') userId: string,
    @Body() dto: CreateSunshineDurationDto,
  ) {
    const ipAddress = req.ip as string;
    const userAgent = req.headers['user-agent'] as string;

    dto.user_id = userId;

    const result = await this.sunshineDurationService.saveSunshineDuration(
      dto,
      ipAddress,
      userAgent,
    );

    return result;
  }

  // Route untuk mengubah data durasi matahari terbit
  @Put('/update')
  async updateSunshineDuration(
    @Req() req: Request,
    @Body() dto: EditSunshineDurationDto,
    @Query() querys: SunshineDurationQueryDto,
  ) {
    const ipAddress = req.ip as string;
    const userAgent = req.headers['user-agent'] as string;

    dto.user_id = querys.user_id;
    dto.id = querys.id;

    const result = await this.sunshineDurationService.updateSunshineDuration(
      dto,
      ipAddress,
      userAgent,
    );

    return result;
  }

  // Route untuk menghapus data durasi matahari terbit
  @ApiOkResponse({
    description: 'Berhasil menghapus data durasi matahari terbit',
  })
  @Delete('/delete')
  async deleteSunshineDuration(
    @Req() req: Request,
    @Query() querys: SunshineDurationQueryDto,
  ) {
    const ipAddress = req.ip as string;
    const userAgent = req.headers['user-agent'] as string;

    return await this.sunshineDurationService.deleteSunshineDuration(
      querys.id,
      querys.user_id,
      ipAddress,
      userAgent,
    );
  }

  // Route untuk ambil semua data durasi matahari terbit
  @ApiOkResponse({
    description: 'Berhasil mendapatkan semua data durasi matahari terbit',
  })
  @Get('/get-all')
  async getAllSunshineDuration() {
    const result = await this.sunshineDurationService.getAllSunshineDuration();
    return result;
  }

  // Route untuk ambil data durasi matahari terbit berdasarkan id
  @ApiOkResponse({
    description:
      'Berhasil mendapatkan data durasi matahari terbit berdasarkan id',
  })
  @Get('/get')
  async getSunshineDurationById(@Query() querys: GetSunshineDurationQueryDto) {
    const result = await this.sunshineDurationService.getSunshineDurationById(
      querys.id,
    );
    return result;
  }
}
