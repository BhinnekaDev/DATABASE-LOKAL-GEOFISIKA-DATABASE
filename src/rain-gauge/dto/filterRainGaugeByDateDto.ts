import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class FilterRainGaugeByDateDto {
  @ApiProperty({
    description: 'Nilai tanggal pada awal pos hujan',
    example: '2023-01-01',
  })
  @IsOptional()
  @IsString()
  start_date?: string;

  @ApiProperty({
    description: 'Nilai tanggal pada akhir pos hujan',
    example: '2023-10-10',
  })
  @IsOptional()
  @IsString()
  end_date?: string;

  @ApiPropertyOptional({
    description: 'Nama kota tempat pos hujan berada',
    example: 'Kepahiang',
  })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({
    description: 'Nama desa tempat pos hujan berada',
    example: 'Kabawetan',
  })
  @IsOptional()
  @IsString()
  village?: string;
}
