import * as dotenv from 'dotenv';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

import { ActivityLogService } from '@/activity-log/activity-log.service';
import { CreateMaxTemperatureDto } from '@/max-temperatur/dto/create-max-temperature.dto';

dotenv.config();

@Injectable()
export class MaxTemperaturService {
  private supabase: SupabaseClient;

  constructor(
    private configService: ConfigService,
    private activityLogService: ActivityLogService,
  ) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>('SUPABASE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase URL atau Anon Key tidak ditemukan.');
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  /**
   * Mengambil data admin berdasarkan user_id
   */
  private async getAdminData(user_id: string) {
    const { data, error } = await this.supabase
      .from('admin')
      .select('first_name, last_name')
      .eq('user_id', user_id)
      .single();

    if (error || !data) {
      return { success: false, message: 'Gagal mengambil data admin', error };
    }

    return { success: true, data };
  }

  /**
   * Menyimpan data max temperatur dan mencatat ke activity log
   */
  async saveMaxTemperature(
    dto: CreateMaxTemperatureDto,
    ipAddress: string,
    userAgent: string,
  ) {
    const { user_id, date, max_temperature } = dto;

    // 1. Cari atau buat tanggal
    let { data: tanggalData, error: tanggalError } = await this.supabase
      .from('date_data')
      .select('id')
      .eq('date', date)
      .single();

    if (tanggalError || !tanggalData) {
      const { data: insertedDate, error: insertDateError } = await this.supabase
        .from('date_data')
        .insert({ date })
        .select('id')
        .single();

      if (insertDateError || !insertedDate) {
        return {
          success: false,
          message: 'Gagal menyimpan atau mendapatkan tanggal dari date_data',
          error: insertDateError,
        };
      }

      tanggalData = insertedDate;
    }

    // 2. Ambil data admin
    const adminResponse = await this.getAdminData(user_id);
    if (!adminResponse.success || !adminResponse.data) {
      return {
        success: false,
        message: 'Data admin tidak ditemukan',
        error: adminResponse.error,
      };
    }

    const { first_name, last_name } = adminResponse.data;
    const namaAdmin = `${first_name} ${last_name}`;

    // 3. Simpan data max temperatur
    const { data: insertedMaxTemperature, error: evaporationError } =
      await this.supabase
        .from('max_temperature')
        .insert({
          id_date: tanggalData.id,
          max_temperature,
        })
        .select()
        .single();

    if (evaporationError) {
      return {
        success: false,
        message: 'Gagal menyimpan data evaporation',
        error: evaporationError,
      };
    }

    // 4. Mencatat ke activity log
    const createdAt = new Date().toLocaleString('en-US', {
      timeZone: 'Asia/Jakarta',
    });

    await this.activityLogService.logActivity({
      admin_id: user_id,
      action: 'Menambahkan Data Max Temperature',
      description: `${namaAdmin} Menambahkan data temperatur maksimal dengan nilai ${max_temperature} untuk tanggal ${date}`,
      ip_address: ipAddress,
      user_agent: userAgent,
      created_at: createdAt,
    });

    return {
      success: true,
      message: 'Data max_temperature berhasil disimpan',
      data: insertedMaxTemperature,
    };
  }
}
