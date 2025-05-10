import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class FilterRainyDaysByDateDto {
  @ApiProperty({
    description: 'Nilai tanggal pada awal hari hujan',
    example: '2023-01-01',
  })
  @IsOptional()
  @IsString()
  start_date?: string;

  @ApiProperty({
    description: 'Nilai tanggal pada akhir hari hujan',
    example: '2023-10-10',
  })
  @IsOptional()
  @IsString()
  end_date?: string;
}
