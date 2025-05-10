import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class FilterTimeSignatureByDateDto {
  @ApiProperty({
    description: 'Nilai tanggal pada awal tanda waktu',
    example: '2023-01-01',
  })
  @IsOptional()
  @IsString()
  start_date?: string;

  @ApiProperty({
    description: 'Nilai tanggal pada akhir tanda waktu',
    example: '2023-10-10',
  })
  @IsOptional()
  @IsString()
  end_date?: string;
}
