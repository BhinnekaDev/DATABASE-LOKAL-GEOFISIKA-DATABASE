import { ApiProperty } from '@nestjs/swagger';

export class GetMicrothermorQueryDto {
  @ApiProperty({ example: 1, description: 'ID data  mikrotermor' })
  id: number;
}
