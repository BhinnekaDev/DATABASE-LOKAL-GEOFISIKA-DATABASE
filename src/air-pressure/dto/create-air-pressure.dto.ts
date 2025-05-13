import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsNumber } from 'class-validator';

export class CreateAirPressureDto {
  @IsNotEmpty()
  @IsString()
  user_id: string;

  @ApiProperty({ description: 'Tekanan udara', example: 1013 })
  @IsNotEmpty()
  @IsNumber()
  air_pressure: number;

  @ApiProperty({
    description: 'Tekanan udara pada pukul 07:00',
    example: 1012.1,
  })
  @IsNotEmpty()
  @IsNumber()
  air_pressure_07: number;

  @ApiProperty({
    description: 'Tekanan udara pada pukul 13:00',
    example: 1012.8,
  })
  @IsNotEmpty()
  @IsNumber()
  air_pressure_13: number;

  @ApiProperty({
    description: 'Tekanan udara pada pukul 18:00',
    example: 1012.5,
  })
  @IsNotEmpty()
  @IsNumber()
  air_pressure_18: number;

  @ApiProperty({
    description: 'Tanggal untuk tekanan udara',
    example: '2025-05-01',
  })
  @IsNotEmpty()
  @IsString()
  date: string;
}
