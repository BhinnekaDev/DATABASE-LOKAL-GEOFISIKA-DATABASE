import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateRainIntensityDto {
  @IsNotEmpty()
  @IsString()
  user_id: string;

  @ApiProperty({
    description: 'Nama intensitas hujan',
    example: `hujan ringan`,
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ description: 'Tanggal', example: '2023-01-01' })
  @IsNotEmpty()
  @IsString()
  date: string;
}
