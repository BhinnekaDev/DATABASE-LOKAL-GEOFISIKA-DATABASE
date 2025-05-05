import { ApiProperty } from '@nestjs/swagger';

export class EvaporationQueryDto {
  @ApiProperty({ example: 1, description: 'ID data evaporation' })
  id: number;

  @ApiProperty({
    example: 'user123',
    description: 'User ID yang melakukan update',
  })
  user_id: string;
}
