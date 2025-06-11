import { ApiProperty } from '@nestjs/swagger';

export class RainfallQueryDto {
  @ApiProperty({ example: 1, description: 'ID data curah hujan' })
  id: number;

  @ApiProperty({
    example: 'user123',
    description: 'User ID dari admin atau operator yang menjadi pelaku aksi',
  })
  user_id: string;
}
