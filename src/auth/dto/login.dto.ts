import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    description: 'Email admin atau operator untuk login',
    example: 'bhinnekaDev24@gmail.com',
  })
  @IsEmail({}, { message: 'Format email tidak valid.' })
  @IsNotEmpty({
    message: 'Email tidak boleh kosong. Harap masukkan email Anda.',
  })
  email: string;

  @ApiProperty({
    description: 'Kata sandi admin atau operator untuk login',
    example: 'bhinnekaDev24.',
  })
  @IsNotEmpty({
    message: 'Kata sandi tidak boleh kosong. Harap masukkan kata sandi Anda.',
  })
  @MinLength(6, {
    message: 'Kata sandi harus memiliki minimal 6 karakter.',
  })
  password: string;
}
