import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsNumber } from 'class-validator';

export class CreateMaxTemperatureDto {
  @ApiProperty({ description: 'ID admin atau operator', example: '1' })
  @IsNotEmpty()
  @IsString()
  user_id: string;

  @ApiProperty({ description: 'Nilai temperatur maksimal', example: '1.2' })
  @IsNotEmpty()
  @IsNumber()
  max_temperature: number;

  @ApiProperty({ description: 'Tanggal', example: '2023-01-01' })
  @IsNotEmpty()
  @IsString()
  date: string;
}
