import * as dotenv from 'dotenv';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

import { CreateLoginLogDto } from '@/login-log/dto/create-login-log.dto';

dotenv.config();

@Injectable()
export class LoginLogService {
  private supabase: SupabaseClient;

  constructor(private configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>('SUPABASE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase URL atau Anon Key tidak ditemukan.');
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  /**
   * Simpan login log.
   */
  async logLogin(dto: CreateLoginLogDto) {
    const { admin_id, ip_address, user_agent } = dto;

    const login_time = new Date().toLocaleString('en-US', {
      timeZone: 'Asia/Jakarta',
    });

    const { data, error } = await this.supabase
      .from('login_log')
      .upsert(
        [
          {
            admin_id,
            ip_address,
            user_agent,
            login_time: login_time,
          },
        ],
        { onConflict: 'admin_id' },
      )
      .single();

    if (error) {
      console.error('Gagal menyimpan login log:', error.message);
      throw new Error(error.message);
    }

    return data;
  }

  /**
   * Mengambil data semua login log.
   */
  async getAllLoginLog() {
    const { data, error } = await this.supabase.from('login_log').select('*');

    if (error) {
      console.error('Gagal mengambil data login log:', error.message);
      throw new Error(error.message);
    }

    return data;
  }

  /**
   * Mengambil data login log berdasarkan admin_id.
   */
  async getLoginLogByUserId(user_id: string) {
    const { data, error } = await this.supabase
      .from('login_log')
      .select('*')
      .eq('admin_id', user_id);

    if (error) {
      console.error('Gagal mengambil data login log:', error.message);
      throw new Error(error.message);
    }

    return data;
  }
}
