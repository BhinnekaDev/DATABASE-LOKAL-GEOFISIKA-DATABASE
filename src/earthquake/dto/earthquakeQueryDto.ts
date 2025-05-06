import { ApiProperty } from '@nestjs/swagger';

export class EarthquakeQueryDto {
  @ApiProperty({ example: 1, description: 'ID data gempa' })
  id: number;

  @ApiProperty({
    example: 'user123',
    description: 'User ID yang melakukan update',
  })
  user_id: string;
}
