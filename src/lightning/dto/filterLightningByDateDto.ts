import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsNotEmpty } from 'class-validator';

export class FilterLightningByDateDto {
  @ApiProperty({
    example: 'Sebagai Contoh (IKL, KML, LDC, Summaries, CSV, SRF)',
    description: 'Nama Data Petir',
  })
  @IsNotEmpty()
  @IsString()
  lightning_data: string;
  @ApiProperty({
    description: 'Nilai tanggal pada awal petir',
    example: '2023-01-01',
  })
  @IsOptional()
  @IsString()
  start_date?: string;

  @ApiProperty({
    description: 'Nilai tanggal pada akhir petir',
    example: '2023-10-10',
  })
  @IsOptional()
  @IsString()
  end_date?: string;
}
