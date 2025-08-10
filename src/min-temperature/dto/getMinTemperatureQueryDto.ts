import { ApiProperty } from '@nestjs/swagger';

export class GetMinTemperatureQueryDto {
  @ApiProperty({ example: 1, description: 'ID data temperatur minimal' })
  id: number;
}
