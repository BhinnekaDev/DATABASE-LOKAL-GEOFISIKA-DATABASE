import { ApiProperty } from '@nestjs/swagger';

export class WindDirectionAndSpeedQueryDto {
  @ApiProperty({ example: 1, description: 'ID data arah dan kecepatan angin' })
  id: number;

  @ApiProperty({
    example: 'user123',
    description: 'User ID dari admin atau operator yang menjadi pelaku aksi',
  })
  user_id: string;
}
