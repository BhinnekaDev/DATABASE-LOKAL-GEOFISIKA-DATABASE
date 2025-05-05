import { ApiProperty } from '@nestjs/swagger';

export class MinTemperatureQueryDto {
  @ApiProperty({ example: 1, description: 'ID data temperatur minimal' })
  id: number;

  @ApiProperty({
    example: 'user123',
    description: 'User ID yang melakukan update',
  })
  user_id: string;
}
