import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumberString } from 'class-validator';
import { IsMMI } from './validatorMMI';

export class FilterEarthquakeByDateDto {
  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'Nilai tanggal pada awal gempa',
    example: '2023-10-01',
    required: false,
  })
  start_date?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'Nilai tanggal pada akhir gempa',
    example: '2023-10-10',
    required: false,
  })
  end_date?: string;

  @IsOptional()
  @IsNumberString()
  @ApiProperty({
    description: 'Nilai minimum magnitude',
    example: '4.5',
    required: false,
  })
  min_magnitude?: string;

  @IsOptional()
  @IsNumberString()
  @ApiProperty({
    description: 'Nilai maksimum magnitude',
    example: '6.0',
    required: false,
  })
  max_magnitude?: string;

  @IsOptional()
  @IsNumberString()
  @ApiProperty({
    description: 'Nilai minimum kedalaman gempa (depth)',
    example: '10',
    required: false,
  })
  min_depth?: string;

  @IsOptional()
  @IsNumberString()
  @ApiProperty({
    description: 'Nilai maksimum kedalaman gempa (depth)',
    example: '100',
    required: false,
  })
  max_depth?: string;

  @IsOptional()
  @IsNumberString()
  @ApiProperty({
    description: 'Nilai minimum latitude gempa',
    example: '0.0',
    required: false,
  })
  min_lat?: string;

  @IsOptional()
  @IsNumberString()
  @ApiProperty({
    description: 'Nilai maksimum latitude gempa',
    example: '0.0',
    required: false,
  })
  max_lat?: string;

  @IsOptional()
  @IsNumberString()
  @ApiProperty({
    description: 'Nilai minimum longitude gempa',
    example: '0.0',
    required: false,
  })
  min_long?: string;

  @IsOptional()
  @IsNumberString()
  @ApiProperty({
    description: 'Nilai maksimum longitude gempa',
    example: '0.0',
    required: false,
  })
  max_long?: string;

  @IsOptional()
  @IsMMI({ message: 'min_mmi must be number (1–12) or Roman numeral (I–XII)' })
  @ApiProperty({
    description: 'Nilai minimum mmi gempa (angka atau Romawi)',
    example: 'I',
    required: false,
  })
  min_mmi?: string;

  @IsOptional()
  @IsMMI({ message: 'max_mmi must be number (1–12) or Roman numeral (I–XII)' })
  @ApiProperty({
    description: 'Nilai maksimum mmi gempa (angka atau Romawi)',
    example: 'XII',
    required: false,
  })
  max_mmi?: string;
}
