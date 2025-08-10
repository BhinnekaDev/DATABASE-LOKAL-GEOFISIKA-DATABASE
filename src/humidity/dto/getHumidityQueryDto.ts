import { ApiProperty } from '@nestjs/swagger';

export class GetHumidityQueryDto {
  @ApiProperty({ example: 1, description: 'ID data kelembapan' })
  id: number;
}
