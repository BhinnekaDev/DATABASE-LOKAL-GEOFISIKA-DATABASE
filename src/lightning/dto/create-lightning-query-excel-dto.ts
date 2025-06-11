import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateLightningQueryExcelDto {
  @ApiProperty({
    example: 'ID User Admin',
    description: 'Admin melakukan insert',
  })
  @IsNotEmpty()
  @IsString()
  user_id: string;

  @ApiProperty({
    example: 'Sebagai Contoh (IKL, KML, LDC, Summaries, CSV, SRF)',
    description: 'Nama Data Petir',
  })
  @IsNotEmpty()
  @IsString()
  lightning_data: string;
}
