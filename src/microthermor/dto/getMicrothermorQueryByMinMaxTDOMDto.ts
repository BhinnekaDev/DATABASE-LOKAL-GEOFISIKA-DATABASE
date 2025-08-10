import { ApiProperty } from '@nestjs/swagger';

export class GetMicrothermorQueryByMinMaxTDOMDto {
  @ApiProperty({ example: 1, description: 'TDOM minimal' })
  min_tdom: number;

  @ApiProperty({ example: 2, description: 'TDOM maksimal' })
  max_tdom: number;
}
