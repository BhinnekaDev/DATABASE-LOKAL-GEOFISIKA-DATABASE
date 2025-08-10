import { ApiProperty } from '@nestjs/swagger';

export class GetWindDirectionAndSpeedQueryDto {
  @ApiProperty({ example: 1, description: 'ID data arah dan kecepatan angin' })
  id: number;
}
