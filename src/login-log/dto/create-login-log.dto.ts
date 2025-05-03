import { IsNotEmpty, IsString } from 'class-validator';

export class CreateLoginLogDto {
  @IsNotEmpty()
  @IsString()
  admin_id: string;

  @IsNotEmpty()
  @IsString()
  login_time: Date;

  @IsNotEmpty()
  @IsString()
  ip_address: string;

  @IsNotEmpty()
  @IsString()
  user_agent: string;
}
