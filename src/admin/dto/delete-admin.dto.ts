import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class DeleteAdminDto {
  @ApiProperty({ example: '123abc', description: 'ID user yang akan dihapus' })
  @IsString()
  user_id: string;

  @ApiProperty({
    example: 'admin123',
    description: 'ID admin yang melakukan penghapusan',
  })
  @IsString()
  id_role: string;
}
