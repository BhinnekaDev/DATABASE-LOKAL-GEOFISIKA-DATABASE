import * as dotenv from 'dotenv';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

import { EditHumidityDto } from '@/humidity/dto/edit-humidity.dto';
import { CreateHumidityDto } from '@/humidity/dto/create-humidity.dto';
import { ActivityLogService } from '@/activity-log/activity-log.service';
import { FilterHumidityByDateDto } from '@/humidity/dto/filterHumidityByDateDto';

dotenv.config();

@Injectable()
export class HumidityService {
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
   * Menyimpan data kelembapan dan mencatat ke activity log
   */
  async saveHumidity(
    dto: CreateHumidityDto,
    ipAddress: string,
    userAgent: string,
  ) {
    const { user_id, humidity_07, humidity_13, humidity_18, date } = dto;

    const avg_humidity = parseFloat(
      ((humidity_07 + humidity_13 + humidity_18) / 3).toFixed(2),
    );

    // 1. Ambil data admin
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

    // 2. Simpan data kelembapan
    const { data: insertedHumidity, error: humidityError } = await this.supabase
      .from('humidity')
      .insert({
        avg_humidity,
        humidity_07,
        humidity_13,
        humidity_18,
        date,
      })
      .select()
      .single();

    if (humidityError || !insertedHumidity) {
      return {
        success: false,
        message: 'Gagal menyimpan data kelembapan',
        error: humidityError,
      };
    }

    // 3. Mencatat ke activity log
    const createdAt = new Date().toLocaleString('en-US', {
      timeZone: 'Asia/Jakarta',
    });

    await this.activityLogService.logActivity({
      admin_id: user_id,
      action: 'Menambahkan Data Kelembapan',
      description: `${namaAdmin} menambahkan data kelembapan dengan rata-rata ${avg_humidity}%. Rincian kelembapan tercatat pada pukul 07:00 sebesar ${humidity_07}%, pukul 13:00 sebesar ${humidity_13}%, dan pukul 18:00 sebesar ${humidity_18}%.`,
      ip_address: ipAddress,
      user_agent: userAgent,
      created_at: createdAt,
    });

    return {
      success: true,
      message: 'Berhasil menyimpan data kelembapan',
      data: insertedHumidity,
    };
  }

  /**
   * Mengubah data kelembapan dan mencatat ke activity log
   */
  async updateHumidity(
    dto: EditHumidityDto,
    ipAddress: string,
    userAgent: string,
  ) {
    const { id, user_id, humidity_07, humidity_13, humidity_18, date } = dto;

    const avg_humidity = parseFloat(
      ((humidity_07 + humidity_13 + humidity_18) / 3).toFixed(2),
    );

    // 1. Ambil data admin
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

    // 2. Update data kelembapan berdasarkan id
    const { data: updatedHumidity, error: humidityError } = await this.supabase
      .from('humidity')
      .update({
        avg_humidity,
        humidity_07,
        humidity_13,
        humidity_18,
        date,
      })
      .eq('id', id)
      .select()
      .single();

    if (humidityError || !updatedHumidity) {
      return {
        success: false,
        message: 'Gagal memperbarui data kelembapan',
        error: humidityError,
      };
    }

    // 3. Catat ke activity log
    const updatedAt = new Date().toLocaleString('en-US', {
      timeZone: 'Asia/Jakarta',
    });

    await this.activityLogService.logActivity({
      admin_id: user_id,
      action: 'Mengubah Data Kelembapan',
      description: `${namaAdmin} mengubah data kelembapan dengan rata-rata ${avg_humidity}%. Rincian kelembapan tercatat pada pukul 07:00 sebesar ${humidity_07}%, pukul 13:00 sebesar ${humidity_13}%, dan pukul 18:00 sebesar ${humidity_18}%.`,
      ip_address: ipAddress,
      user_agent: userAgent,
      created_at: updatedAt,
    });

    return {
      success: true,
      message: 'Berhasil memperbarui data kelembapan',
      data: updatedHumidity,
    };
  }

  /**
   * Menghapus data kelembapan dan mencatat ke activity log
   */
  async deleteHumidity(
    id: number,
    user_id: string,
    ipAddress: string,
    userAgent: string,
  ) {
    // 1. Ambil data admin
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

    // 2. Ambil data kelembapan (untuk log)
    const { data: humidityData, error: getHumidityError } = await this.supabase
      .from('humidity')
      .select('*')
      .eq('id', id)
      .single();

    if (getHumidityError || !humidityData) {
      return {
        success: false,
        message: 'Gagal mengambil data kelembapan',
        error: getHumidityError,
      };
    }

    const { avg_humidity, humidity_07, humidity_13, humidity_18 } =
      humidityData;

    // 3. Hapus data kelembapan
    const { error: deleteHumidityError } = await this.supabase
      .from('humidity')
      .delete()
      .eq('id', id);

    if (deleteHumidityError) {
      return {
        success: false,
        message: 'Gagal menghapus data kelembapan',
        error: deleteHumidityError,
      };
    }

    // 4. Catat ke activity log
    const deletedAt = new Date().toLocaleString('en-US', {
      timeZone: 'Asia/Jakarta',
    });

    await this.activityLogService.logActivity({
      admin_id: user_id,
      action: 'Menghapus Data Kelembapan',
      description: `${namaAdmin} menghapus data kelembapan dengan rata-rata ${avg_humidity}%. Rincian kelembapan tercatat pada pukul 07:00 sebesar ${humidity_07}%, pukul 13:00 sebesar ${humidity_13}%, dan pukul 18:00 sebesar ${humidity_18}%.`,
      ip_address: ipAddress,
      user_agent: userAgent,
      created_at: deletedAt,
    });

    return {
      success: true,
      message: 'Berhasil menghapus data kelembapan',
      data: humidityData,
    };
  }

  /**
   * Mengambil semua data humidity
   */
  async getAllHumidity() {
    const { data, error } = await this.supabase.from('humidity').select(`*`);

    if (error || !data) {
      return {
        success: false,
        message: 'Gagal mengambil data kelembapan',
        error,
      };
    }

    return {
      success: true,
      message: 'Berhasil mengambil semua data kelembapan',
      data: data,
    };
  }

  /**
   * Mengambil semua data humidity berdasarkan id
   */
  async getHumidityById(id: number) {
    const { data, error } = await this.supabase
      .from('humidity')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return {
        success: false,
        message: 'Gagal mengambil data kelembapan berdasarkan id',
        error,
      };
    }

    return {
      success: true,
      message: 'Berhasil mengambil data kelembapan berdasarkan id',
      data,
    };
  }

  /**
   * Mengambil data kelembapan berdasarkan rentang tanggal kelembapan
   */
  async getHumidityByDate(dto: FilterHumidityByDateDto) {
    const { start_date, end_date } = dto;

    const { data, error } = await this.supabase
      .from('humidity')
      .select('*')
      .gte('date', start_date)
      .lte('date', end_date);

    if (error || !data) {
      return {
        success: false,
        message:
          'Gagal mengambil data kelembapan berdasarkan rentang tanggal kelembapan',
        error,
      };
    }

    return {
      success: true,
      message:
        'Berhasil mengambil data kelembapan berdasarkan rentang tanngal kelembapan',
      data,
    };
  }
}
