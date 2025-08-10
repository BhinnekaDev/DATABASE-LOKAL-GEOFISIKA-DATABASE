import * as dotenv from 'dotenv';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { TimeHelperService } from '@/helpers/time-helper.service';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { CreateActivityLogDto } from '@/activity-log/dto/create-activity-log.dto';

dotenv.config();

@Injectable()
export class ActivityLogService {
  private supabase: SupabaseClient;

  constructor(
    private configService: ConfigService,
    private timeHelperService: TimeHelperService,
  ) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>('SUPABASE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase URL atau Anon Key tidak ditemukan.');
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  /**
   * Simpan activity log.
   */
  async logActivity(dto: CreateActivityLogDto) {
    const { admin_id, action, description, ip_address, user_agent } = dto;

    const timeZone = 'Asia/Jakarta';
    const date = new Date();

    const formattedCreatedAt = this.timeHelperService.formatCreatedAt(
      date,
      timeZone,
    );

    const { data, error } = await this.supabase.from('activity_log').insert([
      {
        admin_id,
        action,
        description,
        ip_address,
        user_agent,
        created_at: formattedCreatedAt,
      },
    ]);

    if (error) {
      console.error('Gagal menyimpan activity log:', error.message);
    }

    return data;
  }

  /**
   * Mengambil data semua activity log.
   */
  async getAllActivityLog() {
    const { data, error } = await this.supabase
      .from('activity_log')
      .select('*');

    if (error) {
      console.error('Gagal mengambil data activity log:', error.message);
    }

    return data;
  }

  /**
   * Mengambil data activity log berdasarkan admin_id.
   */
  async getActivityLogByUserId(user_id: string) {
    const { data, error } = await this.supabase
      .from('activity_log')
      .select('*')
      .eq('admin_id', user_id);

    if (error) {
      console.error('Gagal mengambil data activity log:', error.message);
    }

    return data;
  }
}
