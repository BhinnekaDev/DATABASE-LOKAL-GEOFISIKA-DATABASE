import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class FilterRainfallByDateDto {
  @ApiProperty({ description: 'Tanggal mulai', example: '2023-01-01' })
  @IsOptional()
  @IsString()
  start_date?: string;

  @ApiProperty({ description: 'Tanggal akhir', example: '2023-01-01' })
  @IsOptional()
  @IsString()
  end_date?: string;
}
