import { ApiProperty } from '@nestjs/swagger';

export type Role = 'admin' | 'operator';

export class AdminUser {
  @ApiProperty({
    description: 'ID Admin atau operator',
    example: 123,
  })
  id: number;

  @ApiProperty({
    description: 'Email admin atau operator',
    example: 'bhinnekaDev24@gmail.com',
  })
  email: string;

  @ApiProperty({
    description: 'Nama depan admin atau operator',
    example: 'Bhinneka',
  })
  first_name: string;

  @ApiProperty({
    description: 'Nama belakang admin atau operator',
    example: 'Dev',
  })
  last_name: string;

  @ApiProperty({
    description: 'Foto profil admin atau operator',
    example: 'https://contoh.com/bhinnekaDev.jpg',
  })
  photo: string;

  @ApiProperty({
    description: 'Peran admin atau operator',
    example: 'admin',
  })
  role: Role;

  @ApiProperty({
    description: 'ID pengguna di sistem',
    example: 'user-id-123',
  })
  user_id: string;
}

export class DeleteResponse {
  @ApiProperty({
    description: 'Data pengguna yang dihapus',
    type: AdminUser,
  })
  user: AdminUser;

  @ApiProperty({
    description: 'Status penghapusan',
    example: 'success',
  })
  status: string;
}
