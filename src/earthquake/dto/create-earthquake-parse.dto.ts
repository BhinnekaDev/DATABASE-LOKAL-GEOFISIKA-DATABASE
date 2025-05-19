import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateEarthquakeParseDto {
  @IsNotEmpty()
  @IsString()
  user_id: string;

  @ApiProperty({
    example:
      'Mag:2.9, 18-Mei-25 22:23:51 WIB, Lok:4.5 LS - 101.73 BT (105 km BaratDaya SELUMA-BENGKULU), Kedlmn: 76 Km ::BMKG',
    description: 'Data gempa',
  })
  @IsNotEmpty()
  @IsString()
  input: string;
}
