import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsNumber } from 'class-validator';

export class EditMicrothermorDto {
  @IsNotEmpty()
  @IsNumber()
  id: number;

  @IsNotEmpty()
  @IsString()
  user_id: string;

  @ApiProperty({ description: 'Nilai latitude', example: '-1.8' })
  @IsNotEmpty()
  @IsString()
  latitude: string;

  @ApiProperty({ description: 'Nilai longitude', example: '200.5' })
  @IsNotEmpty()
  @IsString()
  longitude: string;

  @ApiProperty({ description: 'Nilai FO', example: 20.13 })
  @IsNotEmpty()
  @IsNumber()
  FO: number;

  @ApiProperty({ description: 'Nilai AO', example: 30.13 })
  @IsNotEmpty()
  @IsNumber()
  AO: number;

  @ApiProperty({ description: 'Nilai TDOM', example: 40.13 })
  @IsNotEmpty()
  @IsNumber()
  TDOM: number;

  @ApiProperty({ description: 'Nilai KG', example: 50.13 })
  @IsNotEmpty()
  @IsNumber()
  KG: number;
}
