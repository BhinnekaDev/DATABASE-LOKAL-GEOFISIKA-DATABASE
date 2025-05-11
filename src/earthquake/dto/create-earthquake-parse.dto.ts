import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateEarthquakeParseDto {
  @IsNotEmpty()
  @IsString()
  user_id: string;

  @ApiProperty({
    example:
      'Mag 3.7, 13-mar-25 17:01:42 WIB, lok:3.61 LS - 102,61 BT (5 km TimurLaut KEPAHIANG-BENGKULU), Kedlmn: 8KM ::BMKG',
    description: 'Data gempa',
  })
  @IsNotEmpty()
  @IsString()
  input: string;
}
