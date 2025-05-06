import { ApiProperty } from '@nestjs/swagger';

export class RainfallQueryDto {
  @ApiProperty({ example: 1, description: 'ID data curah hujan' })
  id: number;

  @ApiProperty({
    example: 'user123',
    description: 'User ID yang melakukan update',
  })
  user_id: string;
}
