import { Request } from 'express';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  Req,
  Post,
  Body,
  Param,
  UsePipes,
  Controller,
  ValidationPipe,
} from '@nestjs/common';

import { LoginDto } from '@/auth/dto/login.dto';
import { AuthService } from '@/auth/auth.service';
import { RegisterDto } from '@/auth/dto/register.dto';
import { SignUpResponse, SignInResponse } from '@/auth/auth.types';

@ApiTags('Autentikasi')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // Route untuk register
  @Post('register/:id_role')
  @UsePipes(new ValidationPipe({ transform: true }))
  @ApiOperation({ summary: 'Register Admin atau Operator' })
  @ApiResponse({
    status: 201,
    description: 'Registrasi berhasil.',
    type: SignUpResponse,
  })
  async register(
    @Param('id_role') id_role: string,
    @Body() registerDto: RegisterDto,
    @Req() req: Request,
  ) {
    const ip_address = req.ip as string;
    const user_agent = req.headers['user-agent'] as string;

    return this.authService.signUp(
      registerDto,
      id_role,
      ip_address,
      user_agent,
    );
  }

  // Route untuk login
  @Post('login')
  @ApiOperation({ summary: 'Login Admin atau Operator' })
  @ApiResponse({
    status: 200,
    description: 'Login berhasil.',
    type: SignInResponse,
  })
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async login(@Body() loginDto: LoginDto, @Req() req: Request) {
    const ip_address = req.ip as string;
    const user_agent = req.headers['user-agent'] as string;

    return this.authService.signIn(loginDto, ip_address, user_agent);
  }
}
