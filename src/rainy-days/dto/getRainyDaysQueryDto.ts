import { ApiProperty } from '@nestjs/swagger';

export class GetRainyDaysQueryDto {
  @ApiProperty({ example: 1, description: 'ID data hari hujan' })
  id: number;
}
