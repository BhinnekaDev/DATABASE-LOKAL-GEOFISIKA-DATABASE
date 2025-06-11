import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsNumber } from 'class-validator';

export class EditRainGaugeQueryDto {
  @ApiProperty({ example: 1, description: 'ID data pos hujan' })
  @IsNumber()
  @IsNotEmpty()
  id: number;

  @ApiProperty({
    example: 'user123',
    description: 'User ID dari admin atau operator yang menjadi pelaku aksi',
  })
  @IsString()
  @IsNotEmpty()
  user_id: string;
}
