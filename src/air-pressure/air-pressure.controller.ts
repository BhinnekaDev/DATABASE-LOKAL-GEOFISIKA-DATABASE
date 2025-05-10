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

import { AirPressureService } from '@/air-pressure/air-pressure.service';
import { AirPressureQueryDto } from '@/air-pressure/dto/airPressureQueryDto';
import { EditAirPressureDto } from '@/air-pressure/dto/edit-air-pressure.dto';
import { CreateAirPressureDto } from '@/air-pressure/dto/create-air-pressure.dto';
import { GetAirPressureQueryDto } from '@/air-pressure/dto/getAirPressureQueryDto';
import { FilterAirPressureByAirPressureDto } from '@/air-pressure/dto/filterAirPressureByDateDto';

@ApiTags('Air Pressure')
@Controller('air-pressure')
export class AirPressureController {
  constructor(private readonly airPressureService: AirPressureService) {}

  // Route untuk menambahkan data tekanan udara
  @Post('/insert')
  async saveAirPressure(
    @Req() req: Request,
    @Query('user_id') userId: string,
    @Body() dto: CreateAirPressureDto,
  ) {
    const ipAddress = req.ip as string;
    const userAgent = req.headers['user-agent'] as string;

    dto.user_id = userId;

    const result = await this.airPressureService.saveAirPressure(
      dto,
      ipAddress,
      userAgent,
    );

    return result;
  }

  // Route untuk mengubah data tekanan udara
  @Put('/update')
  async updateAirPressure(
    @Req() req: Request,
    @Body() dto: EditAirPressureDto,
    @Query() querys: AirPressureQueryDto,
  ) {
    const ipAddress = req.ip as string;
    const userAgent = req.headers['user-agent'] as string;

    dto.user_id = querys.user_id;
    dto.id = querys.id;

    const result = await this.airPressureService.updateAirPressure(
      dto,
      ipAddress,
      userAgent,
    );
    return result;
  }

  // Route untuk menghapus data tekanan udara
  @ApiOkResponse({ description: 'Berhasil menghapus data tekanan udara' })
  @Delete('/delete')
  async deleteAirPressure(
    @Req() req: Request,
    @Query() querys: AirPressureQueryDto,
  ) {
    const ipAddress = req.ip as string;
    const userAgent = req.headers['user-agent'] as string;

    return await this.airPressureService.deleteAirPressure(
      querys.id,
      querys.user_id,
      ipAddress,
      userAgent,
    );
  }

  // Route untuk ambil semua data tekanan udara
  @ApiOkResponse({
    description: 'Berhasil mendapatkan semua data tekanan udara',
  })
  @Get('/get-all')
  async getAllAirPressure() {
    return await this.airPressureService.getAllAirPressure();
  }

  // Route untuk ambil semua data tekanan udara berdasarkan id
  @ApiOkResponse({
    description: 'Berhasil mendapatkan data tekanan udara berdasarkan id',
  })
  @Get('/get')
  async getAirPressure(@Query() querys: GetAirPressureQueryDto) {
    const result = await this.airPressureService.getAirPressureById(querys.id);
    return result;
  }

  // Route untuk ambil data tekanan udara berdasarkan rentang tekanan udara
  @ApiOkResponse({
    description:
      'Berhasil mendapatkan data tekanan udara berdasarkan rentang tekanan udara',
  })
  @Get('/get-by-air-pressure')
  async getAirPressureByAirPressure(
    @Query() query: FilterAirPressureByAirPressureDto,
  ) {
    return await this.airPressureService.getAirPressureByAirPressure(query);
  }
}
