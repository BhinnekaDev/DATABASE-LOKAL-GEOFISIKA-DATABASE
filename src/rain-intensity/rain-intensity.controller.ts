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

import { RainIntensityService } from '@/rain-intensity/rain-intensity.service';
import { RainIntensityQueryDto } from '@/rain-intensity/dto/rainIntensityQueryDto';
import { EditRainIntensityDto } from '@/rain-intensity/dto/edit-rain-intensity.dto';
import { CreateRainIntensityDto } from '@/rain-intensity/dto/create-rain-intensity.dto';
import { GetRainIntensityQueryDto } from '@/rain-intensity/dto/getRainIntensityQueryDto';
import { FilterRainIntensityByDateDto } from '@/rain-intensity/dto/filterRainIntensityByDateDto';
import { CreateRainIntensityExcelDto } from '@/rain-intensity/dto/create-rain-intensity-excel.dto';

@ApiTags('Rain Intensity')
@Controller('rain-intensity')
export class RainIntensityController {
  constructor(private readonly rainIntensityService: RainIntensityService) {}

  // Route untuk menambah data intensitas hujan
  @Post('/insert')
  async saveRainIntensity(
    @Req() req: Request,
    @Query('user_id') userId: string,
    @Body() dto: CreateRainIntensityDto,
  ) {
    const ipAddress = req.ip as string;
    const userAgent = req.headers['user-agent'] as string;

    dto.user_id = userId;

    const result = await this.rainIntensityService.saveRainIntensity(
      dto,
      ipAddress,
      userAgent,
    );

    return result;
  }

  // Route untuk menyimpan data excel intensitas hujan
  @Post('/insert-excel')
  async saveRainIntensityExcel(
    @Req() req: Request,
    @Query('user_id') userId: string,
    @Body() dto: CreateRainIntensityExcelDto,
  ) {
    const ipAddress = req.ip as string;
    const userAgent = req.headers['user-agent'] as string;

    dto.user_id = userId;

    const result = await this.rainIntensityService.saveExcelRainIntensity(
      dto,
      ipAddress,
      userAgent,
    );

    return result;
  }

  // Route untuk mengubah data intensitas hujan
  @Put('/update')
  async updateRainIntensity(
    @Req() req: Request,
    @Body() dto: EditRainIntensityDto,
    @Query() querys: RainIntensityQueryDto,
  ) {
    const ipAddress = req.ip as string;
    const userAgent = req.headers['user-agent'] as string;

    dto.user_id = querys.user_id;
    dto.id = querys.id;

    const result = await this.rainIntensityService.updateRainIntensity(
      dto,
      ipAddress,
      userAgent,
    );

    return result;
  }

  // Route untuk menghapus data intensitas hujan
  @ApiOkResponse({ description: 'Berhasil menghapus data intensitas hujan' })
  @Delete('/delete')
  async deleteRainIntensity(
    @Req() req: Request,
    @Query() querys: RainIntensityQueryDto,
  ) {
    const ipAddress = req.ip as string;
    const userAgent = req.headers['user-agent'] as string;

    return await this.rainIntensityService.deleteRainIntensity(
      querys.id,
      querys.user_id,
      ipAddress,
      userAgent,
    );
  }

  // Route untuk ambil semua data intensitas hujan
  @ApiOkResponse({
    description: 'Berhasil mendapatkan semua data intensitas hujan',
  })
  @Get('/get-all')
  async getAllRainIntensity() {
    const result = await this.rainIntensityService.getAllRainIntensity();
    return result;
  }

  // Route untuk ambil data intensitas hujan berdasarkan id
  @ApiOkResponse({
    description: 'Berhasil mendapatkan data intensitas hujan berdasarkan id',
  })
  @Get('/get')
  async getRainIntensityById(@Query() querys: GetRainIntensityQueryDto) {
    const result = await this.rainIntensityService.getRainIntensityById(
      querys.id,
    );
    return result;
  }

  // Route untuk ambil data intensitas hujan berdasarkan rentang tanggal
  @ApiOkResponse({
    description:
      'Berhasil mendapatkan data intensitas hujan berdasarkan rentang tanggal',
  })
  @Get('/get-by-date')
  async getRainIntensityByDate(@Query() query: FilterRainIntensityByDateDto) {
    return await this.rainIntensityService.getRainIntensityByDate(query);
  }
}
