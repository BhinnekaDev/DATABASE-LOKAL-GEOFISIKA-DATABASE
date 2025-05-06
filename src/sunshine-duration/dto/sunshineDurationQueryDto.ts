import { ApiProperty } from '@nestjs/swagger';

export class SunshineDurationQueryDto {
  @ApiProperty({ example: 1, description: 'ID data durasi matahari terbit' })
  id: number;

  @ApiProperty({
    example: 'user123',
    description: 'User ID yang melakukan update',
  })
  user_id: string;
}
