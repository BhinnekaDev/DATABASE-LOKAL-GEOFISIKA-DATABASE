import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEmail, IsEnum } from 'class-validator';

export enum Role {
  ADMIN = 'admin',
  OPERATOR = 'operator',
}

export class UpdateAdminDto {
  @ApiProperty({ example: '123abc', description: 'ID user yang akan diubah' })
  @IsString()
  user_id: string;

  @ApiProperty({
    example: 'admin123',
    description: 'ID admin yang melakukan pengeditan',
  })
  @IsString()
  id_role: string;

  @ApiProperty({ example: 'Bhinneka Baru', description: 'Nama depan admin' })
  @IsString()
  first_name: string;

  @ApiProperty({ example: 'Dev Baru', description: 'Nama belakang admin' })
  @IsString()
  last_name: string;

  @ApiProperty({
    example: 'bhinnekaDev24Baru@gmail.com',
    description: 'Email admin',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'operator',
    description: 'Role admin',
    enum: Role,
  })
  @IsEnum(Role)
  role: Role;

  @ApiProperty({
    example: 'https://contoh.com/bhinnekaDevBaru.jpg',
    description: 'URL foto profil admin',
    required: false,
  })
  @IsOptional()
  @IsString()
  photo?: string;

  @ApiProperty({
    example: 'newPassword123',
    description: 'Password baru admin',
    required: false,
  })
  @IsOptional()
  @IsString()
  password?: string;
}
