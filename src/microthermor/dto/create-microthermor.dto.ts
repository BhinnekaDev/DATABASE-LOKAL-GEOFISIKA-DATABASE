import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsNumber } from 'class-validator';

export class CreateMicrothermorDto {
  @IsNotEmpty()
  @IsString()
  user_id: string;

  @ApiProperty({ description: 'Nilai latitude', example: '-1.2' })
  @IsNotEmpty()
  @IsString()
  latitude: string;

  @ApiProperty({ description: 'Nilai longitude', example: '100.5' })
  @IsNotEmpty()
  @IsString()
  longitude: string;

  @ApiProperty({ description: 'Nilai FO', example: 10.13 })
  @IsNotEmpty()
  @IsNumber()
  FO: number;

  @ApiProperty({ description: 'Nilai AO', example: 20.13 })
  @IsNotEmpty()
  @IsNumber()
  AO: number;

  @ApiProperty({ description: 'Nilai TDOM', example: 30.13 })
  @IsNotEmpty()
  @IsNumber()
  TDOM: number;

  @ApiProperty({ description: 'Nilai KG', example: 40.13 })
  @IsNotEmpty()
  @IsNumber()
  KG: number;
}
