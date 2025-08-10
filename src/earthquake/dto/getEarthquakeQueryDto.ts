import { ApiProperty } from '@nestjs/swagger';

export class GetEarthquakeQueryDto {
  @ApiProperty({ example: 1, description: 'ID data gempa' })
  id: number;
}
