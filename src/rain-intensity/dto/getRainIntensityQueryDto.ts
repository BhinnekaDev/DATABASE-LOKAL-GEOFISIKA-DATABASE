import { ApiProperty } from '@nestjs/swagger';

export class GetRainIntensityQueryDto {
  @ApiProperty({ example: 1, description: 'ID data intensitas hujan' })
  id: number;
}
