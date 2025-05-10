import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsNumber } from 'class-validator';

export class FilterAverageTemperatureByAverageTemperatureDto {
  @ApiProperty({
    description: 'Nilai temperatur rata rata pada awal temperatur rata rata',
    example: 10,
  })
  @IsOptional()
  @IsNumber()
  start_average_temperature?: number;

  @ApiProperty({
    description: 'Nilai temperatur rata rata pada akhir temperatur rata rata',
    example: 100,
  })
  @IsOptional()
  @IsNumber()
  end_average_temperature?: number;
}
