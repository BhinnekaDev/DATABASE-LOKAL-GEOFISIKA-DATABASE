import { ApiProperty } from '@nestjs/swagger';

export class GetAverageTemperatureQueryDto {
  @ApiProperty({ example: 1, description: 'ID data temperatur rata rata' })
  id: number;
}
