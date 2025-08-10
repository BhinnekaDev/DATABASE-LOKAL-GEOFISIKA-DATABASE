import { ApiProperty } from '@nestjs/swagger';

export class GetMaxTemperatureQueryDto {
  @ApiProperty({ example: 1, description: 'ID data temperatur maksimal' })
  id: number;
}
