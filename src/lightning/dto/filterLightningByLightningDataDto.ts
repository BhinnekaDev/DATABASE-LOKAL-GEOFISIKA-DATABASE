import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class FilterLightningByLightningDataDto {
  @ApiProperty({
    example: 'Sebagai Contoh (IKL, KML, LDC, Summaries, CSV, SRF)',
    description: 'Nama Data Petir',
  })
  @IsNotEmpty()
  @IsString()
  lightning_data: string;
}
