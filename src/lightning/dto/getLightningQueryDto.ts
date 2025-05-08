import { ApiProperty } from '@nestjs/swagger';

export class GetLightningQueryDto {
  @ApiProperty({ example: 1, description: 'ID data petir' })
  id: number;
}
