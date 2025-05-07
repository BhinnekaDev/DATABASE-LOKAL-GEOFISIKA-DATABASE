import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsNumber } from 'class-validator';

export class CreateAverageTemperatureDto {
  @IsNotEmpty()
  @IsString()
  user_id: string;

  @ApiProperty({
    description: 'Temperatur rata rata pada pukul 07:00',
    example: 1012.1,
  })
  @IsNotEmpty()
  @IsNumber()
  avg_temperature_07: number;

  @ApiProperty({
    description: 'Temperatur rata rata pada pukul 13:00',
    example: 1012.8,
  })
  @IsNotEmpty()
  @IsNumber()
  avg_temperature_13: number;

  @ApiProperty({
    description: 'Temperatur rata rata pada pukul 18:00',
    example: 1012.5,
  })
  @IsNotEmpty()
  @IsNumber()
  avg_temperature_18: number;
}
