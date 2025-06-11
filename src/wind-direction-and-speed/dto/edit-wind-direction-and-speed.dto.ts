import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class EditWindDirectionAndSpeedDto {
  @IsNotEmpty()
  @IsNumber()
  id: number;

  @IsNotEmpty()
  @IsString()
  user_id: string;

  @ApiProperty({ description: 'Tanggal', example: '2023-01-01' })
  @IsNotEmpty()
  @IsString()
  date: string;

  @ApiProperty({
    description: 'Kecepatan angin rata-rata',
    example: 12.5,
  })
  @IsNotEmpty()
  @IsNumber()
  speed: number;

  @ApiProperty({
    description: 'Arah Terbanyak',
    example: 'Timur',
  })
  @IsNotEmpty()
  @IsString()
  most_frequent_direction: string;

  @ApiProperty({
    description: 'Kecepatan angin maksimum',
    example: 20.1,
  })
  @IsNotEmpty()
  @IsNumber()
  max_speed: number;

  @ApiProperty({
    description: 'Arah angin',
    example: 'Barat',
  })
  @IsNotEmpty()
  @IsString()
  direction: string;
}
