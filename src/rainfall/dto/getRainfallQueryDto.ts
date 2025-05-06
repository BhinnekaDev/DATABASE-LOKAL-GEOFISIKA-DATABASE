import { ApiProperty } from '@nestjs/swagger';

export class GetRainfallQueryDto {
  @ApiProperty({ example: 1, description: 'ID data curah hujan' })
  id: number;
}
