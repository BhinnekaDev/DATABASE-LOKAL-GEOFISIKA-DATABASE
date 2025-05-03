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

export class SignInResponse {
  @ApiProperty({
    description: 'Pesan yang diberikan setelah login',
    example: 'Login berhasil',
  })
  message: string;

  @ApiProperty({
    description: 'ID pengguna yang berhasil login',
    example: 'user-id-123',
  })
  user_id: string;

  @ApiProperty({
    description: 'Token akses setelah login',
    example: 'access-token-123',
  })
  access_token: string;

  @ApiProperty({
    description: 'Peran admin atau operator',
    example: 'admin',
  })
  role: string;
}

export class SignUpResponse {
  @ApiProperty({
    description: 'Pesan yang diberikan setelah registrasi',
    example: 'admin berhasil didaftarkan',
  })
  message: string;

  @ApiProperty({
    description: 'Data pengguna yang terdaftar',
    type: AdminUser,
  })
  user: AdminUser;
}
