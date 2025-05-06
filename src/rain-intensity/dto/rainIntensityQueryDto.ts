import { ApiProperty } from '@nestjs/swagger';

export class RainIntensityQueryDto {
  @ApiProperty({ example: 1, description: 'ID data intensitas hujan' })
  id: number;

  @ApiProperty({
    example: 'user123',
    description: 'User ID yang melakukan update',
  })
  user_id: string;
}
