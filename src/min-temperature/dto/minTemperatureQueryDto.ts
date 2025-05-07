import { ApiProperty } from '@nestjs/swagger';

export class MinTemperatureQueryDto {
  @ApiProperty({ example: 1, description: 'ID data temperatur minimal' })
  id: number;

  @ApiProperty({
    example: 'user123',
    description: 'User ID dari admin atau operator yang menjadi pelaku aksi',
  })
  user_id: string;
}
