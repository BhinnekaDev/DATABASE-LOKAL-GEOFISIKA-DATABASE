import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsNumber } from 'class-validator';

export class EditRainyDaysDto {
  @IsNotEmpty()
  @IsNumber()
  id: number;

  @IsNotEmpty()
  @IsString()
  user_id: string;

  @ApiProperty({ description: 'Nilai hari hujan', example: 'senin' })
  @IsNotEmpty()
  @IsString()
  rainy_day: number;

  @ApiProperty({ description: 'Tanggal', example: '2023-01-01' })
  @IsNotEmpty()
  @IsString()
  date: string;
}
