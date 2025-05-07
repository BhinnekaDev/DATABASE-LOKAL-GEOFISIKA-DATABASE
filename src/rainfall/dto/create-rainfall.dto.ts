import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsNumber } from 'class-validator';

export class CreateRainfallDto {
  @IsNotEmpty()
  @IsString()
  user_id: string;

  @ApiProperty({ description: 'Nilai curah hujan', example: '1.2' })
  @IsNotEmpty()
  @IsNumber()
  rainfall: number;

  @ApiProperty({ description: 'Tanggal', example: '2023-01-01' })
  @IsNotEmpty()
  @IsString()
  date: string;
}
