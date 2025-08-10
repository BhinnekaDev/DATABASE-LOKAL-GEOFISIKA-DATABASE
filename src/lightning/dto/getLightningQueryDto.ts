import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class GetLightningQueryDto {
  @ApiProperty({ example: 1, description: 'ID data petir' })
  id: number;

  @ApiProperty({
    example: 'Sebagai Contoh (IKL, KML, LDC, Summaries, CSV, SRF)',
    description: 'Nama Data Petir',
  })
  @IsNotEmpty()
  @IsString()
  lightning_data: string;
}
