import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class FilterHumidityByAverageDto {
  @ApiProperty({
    description: 'Nilai rata rata pada awal kelembapan',
    example: '10',
  })
  @IsOptional()
  @IsString()
  start_average_humidity?: string;

  @ApiProperty({
    description: 'Nilai rata rata pada akhir kelembapan',
    example: '100',
  })
  @IsOptional()
  @IsString()
  end_average_humidity?: string;
}
