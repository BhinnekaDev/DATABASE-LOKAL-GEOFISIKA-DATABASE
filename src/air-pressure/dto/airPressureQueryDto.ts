import { ApiProperty } from '@nestjs/swagger';

export class AirPressureQueryDto {
  @ApiProperty({ example: 1, description: 'ID data tekanan udara' })
  id: number;

  @ApiProperty({
    example: 'user123',
    description: 'User ID yang melakukan update',
  })
  user_id: string;
}
