import { ApiProperty } from '@nestjs/swagger';

export class GetEvaporationQueryDto {
  @ApiProperty({ example: 1, description: 'ID data evaporation' })
  id: number;
}
