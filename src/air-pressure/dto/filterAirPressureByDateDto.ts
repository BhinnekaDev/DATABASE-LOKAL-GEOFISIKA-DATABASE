import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsNumber } from 'class-validator';

export class FilterAirPressureByAirPressureDto {
  @ApiProperty({
    description: 'Nilai tekanan udara pada awal tekanan udara',
    example: 1000,
  })
  @IsOptional()
  @IsNumber()
  start_air_pressure?: number;

  @ApiProperty({
    description: 'Nilai tekanan udara pada akhir tekanan udara',
    example: 5000,
  })
  @IsOptional()
  @IsNumber()
  end_air_pressure?: number;
}
