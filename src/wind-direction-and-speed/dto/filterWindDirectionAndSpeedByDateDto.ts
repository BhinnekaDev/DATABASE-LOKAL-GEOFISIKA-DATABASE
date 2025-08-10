import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class FilterWindDirectionAndSpeedByDateDto {
  @ApiProperty({
    description: 'Nilai awal tanggal',
    example: '2023-01-01',
  })
  @IsOptional()
  @IsString()
  start_date?: string;

  @ApiProperty({
    description: 'Nilai akhir tanggal',
    example: '2023-10-10',
  })
  @IsOptional()
  @IsString()
  end_date?: string;
}
