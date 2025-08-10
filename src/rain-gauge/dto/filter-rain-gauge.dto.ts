import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class FilterRainGaugeDto {
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
