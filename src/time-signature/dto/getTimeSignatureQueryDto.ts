import { ApiProperty } from '@nestjs/swagger';

export class GetTimeSignatureQueryDto {
  @ApiProperty({ example: 1, description: 'ID data tanda waktu' })
  id: number;
}
