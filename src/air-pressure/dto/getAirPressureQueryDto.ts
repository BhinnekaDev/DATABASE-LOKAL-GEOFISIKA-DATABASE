import { ApiProperty } from '@nestjs/swagger';

export class GetAirPressureQueryDto {
  @ApiProperty({ example: 1, description: 'ID data tekanan udara' })
  id: number;
}
