import { ApiProperty } from '@nestjs/swagger';

export class LightningQueryDto {
  @ApiProperty({ example: 1, description: 'ID data petir' })
  id: number;

  @ApiProperty({
    example: 'user123',
    description: 'User ID dari admin atau operator yang menjadi pelaku aksi',
  })
  user_id: string;
}
