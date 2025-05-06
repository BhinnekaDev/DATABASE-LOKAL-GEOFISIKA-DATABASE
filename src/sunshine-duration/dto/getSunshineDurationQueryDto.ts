import { ApiProperty } from '@nestjs/swagger';

export class GetSunshineDurationQueryDto {
  @ApiProperty({ example: 1, description: 'ID data durasi matahari terbit' })
  id: number;
}
