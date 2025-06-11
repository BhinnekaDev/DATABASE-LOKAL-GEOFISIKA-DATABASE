import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateRainGaugeQueryExcelDto {
  @ApiProperty({
    example: 'ID User Admin',
    description: 'Admin melakukan insert',
  })
  @IsNotEmpty()
  @IsString()
  user_id: string;
  @ApiProperty({
    example: 'Kepahiang',
    description: 'Kota lokasi stasiun',
  })
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty({
    example: 'Kabawetan',
    description: 'Kelurahan atau desa lokasi stasiun',
  })
  @IsString()
  @IsNotEmpty()
  village: string;
}
