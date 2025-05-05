import { ApiProperty } from '@nestjs/swagger';

export class MaxTemperatureQueryDto {
  @ApiProperty({ example: 1, description: 'ID data temperatur maksimal' })
  id: number;

  @ApiProperty({
    example: 'user123',
    description: 'User ID yang melakukan update',
  })
  user_id: string;
}
