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

import { WindDirectionAndSpeedService } from '@/wind-direction-and-speed/wind-direction-and-speed.service';
import { WindDirectionAndSpeedQueryDto } from '@/wind-direction-and-speed/dto/windDirectionAndSpeedQueryDto';
import { EditWindDirectionAndSpeedDto } from '@/wind-direction-and-speed/dto/edit-wind-direction-and-speed.dto';
import { GetWindDirectionAndSpeedQueryDto } from '@/wind-direction-and-speed/dto/getWindDirectionAndSpeedQueryDto';
import { CreateWindDirectionAndSpeedDto } from '@/wind-direction-and-speed/dto/create-wind-direction-and-speed.dto';
import { FilterWindDirectionAndSpeedByDateDto } from '@/wind-direction-and-speed/dto/filterWindDirectionAndSpeedByDateDto';
import { CreateWindDirectionAndSpeedExcelDto } from '@/wind-direction-and-speed/dto/create-wind-direction-and-speed-excel.dto';

@ApiTags('Wind Direction And Speed')
@ApiOkResponse()
@Controller('wind-direction-and-speed')
export class WindDirectionAndSpeedController {
  constructor(
    private readonly windDirectionAndSpeedService: WindDirectionAndSpeedService,
  ) {}

  // Route untuk menambah data arah dan kecepatan angin
  @Post('/insert')
  async saveWindDirectionAndSpeed(
    @Req() req: Request,
    @Query('user_id') userId: string,
    @Body() dto: CreateWindDirectionAndSpeedDto,
  ) {
    const ipAddress = req.ip as string;
    const userAgent = req.headers['user-agent'] as string;

    dto.user_id = userId;

    const result =
      await this.windDirectionAndSpeedService.saveWindDirectionAndSpeed(
        dto,
        ipAddress,
        userAgent,
      );

    return result;
  }

  // Route untuk menyimpan data excel data arah dan kecepatan angin
  @Post('/insert-excel')
  async saveExcelWindDirectionAndSpeed(
    @Req() req: Request,
    @Query('user_id') userId: string,
    @Body() dto: CreateWindDirectionAndSpeedExcelDto,
  ) {
    const ipAddress = req.ip as string;
    const userAgent = req.headers['user-agent'] as string;

    dto.user_id = userId;

    const result =
      await this.windDirectionAndSpeedService.saveExcelWindDirectionAndSpeed(
        dto,
        ipAddress,
        userAgent,
      );

    return result;
  }

  // Route untuk mengubah data arah dan kecepatan angin
  @Put('/update')
  async updateWindDirectionAndSpeed(
    @Req() req: Request,
    @Body() dto: EditWindDirectionAndSpeedDto,
    @Query() querys: WindDirectionAndSpeedQueryDto,
  ) {
    const ipAddress = req.ip as string;
    const userAgent = req.headers['user-agent'] as string;

    dto.user_id = querys.user_id;
    dto.id = querys.id;

    const result =
      await this.windDirectionAndSpeedService.updateWindDirectionAndSpeed(
        dto,
        ipAddress,
        userAgent,
      );
    return result;
  }

  // Route untuk menghapus data arah dan kecepatan angin
  @ApiOkResponse({
    description: 'Berhasil menghapus data arah dan kecepatan angin',
  })
  @Delete('/delete')
  async deleteWindDirectionAndSpeed(
    @Req() req: Request,
    @Query() querys: WindDirectionAndSpeedQueryDto,
  ) {
    const ipAddress = req.ip as string;
    const userAgent = req.headers['user-agent'] as string;

    return await this.windDirectionAndSpeedService.deleteWindDirectionAndSpeed(
      querys.id,
      querys.user_id,
      ipAddress,
      userAgent,
    );
  }

  // Route untuk ambil semua data arah dan kecepatan angin
  @ApiOkResponse({
    description: 'Berhasil mendapatkan semua data arah dan kecepatan angin',
  })
  @Get('/get-all')
  async getAllWindDirectionAndSpeed() {
    return await this.windDirectionAndSpeedService.getAllWindDirectionAndSpeed();
  }

  // Route untuk ambil semua data arah dan kecepatan angin berdasarkan id
  @ApiOkResponse({
    description:
      'Berhasil mendapatkan data arah dan kecepatan angin berdasarkan id',
  })
  @Get('/get')
  async getWindDirectionAndSpeedById(
    @Query() querys: GetWindDirectionAndSpeedQueryDto,
  ) {
    const result =
      await this.windDirectionAndSpeedService.getWindDirectionAndSpeedById(
        querys.id,
      );
    return result;
  }

  // Route untuk ambil data arah dan kecepatan angin berdasarkan rentang tanggal arah dan kecepatan angin
  @ApiOkResponse({
    description:
      'Berhasil mendapatkan data arah dan kecepatan angin berdasarkan rentang tanggal arah dan kecepatan angin',
  })
  @Get('/get-by-date')
  async getWindDirectionAndSpeedByDate(
    @Query() query: FilterWindDirectionAndSpeedByDateDto,
  ) {
    return await this.windDirectionAndSpeedService.getWindDirectionAndSpeedByDate(
      query,
    );
  }
}
