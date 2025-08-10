import { ApiProperty } from '@nestjs/swagger';

export class AirPressureQueryDto {
  @ApiProperty({ example: 1, description: 'ID data tekanan udara' })
  id: number;

  @ApiProperty({
    example: 'user123',
    description: 'User ID dari admin atau operator yang menjadi pelaku aksi',
  })
  user_id: string;
}
