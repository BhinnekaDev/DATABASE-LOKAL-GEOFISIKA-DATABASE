import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsNumber } from 'class-validator';

export class FilterHumidityByAverageDto {
  @ApiProperty({
    description: 'Nilai rata rata pada awal kelembapan',
    example: 10,
  })
  @IsOptional()
  @IsNumber()
  start_average_humidity?: number;

  @ApiProperty({
    description: 'Nilai rata rata pada akhir kelembapan',
    example: 100,
  })
  @IsOptional()
  @IsNumber()
  end_average_humidity?: number;
}
