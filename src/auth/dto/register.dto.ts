import { ApiProperty } from '@nestjs/swagger';
import {
  IsUrl,
  IsEnum,
  IsEmail,
  Matches,
  IsString,
  MinLength,
  IsNotEmpty,
  IsOptional,
} from 'class-validator';

export class RegisterDto {
  @ApiProperty({
    description: 'Email admin atau operator untuk registrasi',
    example: 'bhinnekaDev24@gmail.com',
  })
  @IsEmail({}, { message: 'Email yang dimasukkan tidak valid.' })
  @IsNotEmpty({ message: 'Email tidak boleh kosong.' })
  email: string;

  @ApiProperty({
    description: 'Password admin atau operator untuk registrasi',
    example: 'bhinnekaDev24.',
  })
  @IsNotEmpty({ message: 'Password tidak boleh kosong.' })
  @MinLength(8, { message: 'Password harus memiliki minimal 8 karakter.' })
  @Matches(/^(?=.*[0-9])(?=.*[!@#$%^&*.])[A-Za-z0-9!@#$%^&*.]{8,}$/, {
    message:
      'Password harus mengandung minimal 8 karakter, dengan angka dan simbol seperti !@#$%^&*.',
  })
  password: string;

  @ApiProperty({
    description: 'Nama depan admin atau operator',
    example: 'Bhinneka',
  })
  @IsNotEmpty({ message: 'Nama depan tidak boleh kosong.' })
  first_name: string;

  @ApiProperty({
    description: 'Nama belakang admin atau operator',
    example: 'Developer',
  })
  @IsNotEmpty({ message: 'Nama belakang tidak boleh kosong.' })
  last_name: string;

  @ApiProperty({
    description: 'Foto profil admin atau operator (opsional)',
    example: 'https://contoh.com/bhinnekaDev.jpg',
    required: false,
  })
  @IsOptional()
  @IsUrl({}, { message: 'URL foto profil tidak valid.' })
  @IsString({ message: 'Foto profil harus berupa string.' })
  photo?: string;

  @ApiProperty({
    description: 'Peran admin atau operator',
    enum: ['admin', 'operator'],
    example: 'admin',
  })
  @IsEnum(['admin', 'operator'], {
    message: 'Peran harus salah satu dari admin atau operator.',
  })
  role: 'admin' | 'operator';
}
