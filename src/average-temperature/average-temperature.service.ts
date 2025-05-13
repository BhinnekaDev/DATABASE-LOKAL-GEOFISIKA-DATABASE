import * as dotenv from 'dotenv';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

import { ActivityLogService } from '@/activity-log/activity-log.service';
import { EditAverageTemperatureDto } from '@/average-temperature/dto/edit-average-temperature.dto';
import { CreateAverageTemperatureDto } from '@/average-temperature/dto/create-average-temperature.dto';
import { FilterAverageTemperatureByAverageTemperatureDto } from './dto/filterAverageTemperatureByAverageTemperatureDto';

dotenv.config();

@Injectable()
export class AverageTemperatureService {
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
   * Menyimpan data temperatur rata rata dan mencatat ke activity log
   */
  async saveAverageTemperature(
    dto: CreateAverageTemperatureDto,
    ipAddress: string,
    userAgent: string,
  ) {
    const {
      user_id,
      avg_temperature_07,
      avg_temperature_13,
      avg_temperature_18,
      date,
    } = dto;

    const avg_temperature = parseFloat(
      (
        (avg_temperature_07 + avg_temperature_13 + avg_temperature_18) /
        3
      ).toFixed(2),
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

    // 2. Simpan data temperatur rata rata
    const { data: insertedAvgTemperature, error: insertError } =
      await this.supabase
        .from('average_temperature')
        .insert([
          {
            avg_temperature,
            avg_temperature_07,
            avg_temperature_13,
            avg_temperature_18,
            date,
          },
        ])

        .select();

    if (insertError) {
      return {
        success: false,
        message: 'Gagal menyimpan data temperatur rata rata',
        error: insertError,
      };
    }

    // 3. Mencatat ke activity log
    const createdAt = new Date().toLocaleString('en-US', {
      timeZone: 'Asia/Jakarta',
    });

    await this.activityLogService.logActivity({
      admin_id: user_id,
      action: 'Menambahkan Data Temperatur Rata-Rata',
      description: `${namaAdmin} menambahkan data temperatur rata-rata sebesar ${avg_temperature}°C, yang diukur pada pukul ${avg_temperature_07}, ${avg_temperature_13}, dan ${avg_temperature_18}.`,
      ip_address: ipAddress,
      user_agent: userAgent,
      created_at: createdAt,
    });

    return {
      success: true,
      message: 'Berhasil menyimpan data temperatur rata rata',
      data: insertedAvgTemperature,
    };
  }

  /**
   * Mengubah data temperatur rata rata dan mencatat ke activity log
   */
  async updateAverageTemperature(
    dto: EditAverageTemperatureDto,
    ipAddress: string,
    userAgent: string,
  ) {
    const {
      id,
      user_id,
      avg_temperature_07,
      avg_temperature_13,
      avg_temperature_18,
      date,
    } = dto;

    const avg_temperature = parseFloat(
      (
        (avg_temperature_07 + avg_temperature_13 + avg_temperature_18) /
        3
      ).toFixed(2),
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

    // 2. Update data temperatur rata rata berdasarkan id
    const { data: updatedAvgTemperature, error: updateError } =
      await this.supabase
        .from('average_temperature')
        .update({
          avg_temperature,
          avg_temperature_07,
          avg_temperature_13,
          avg_temperature_18,
          date,
        })
        .eq('id', id)
        .select();

    if (updateError) {
      return {
        success: false,
        message: 'Gagal mengubah data temperatur rata rata',
        error: updateError,
      };
    }

    // 3. Mencatat ke activity log
    const createdAt = new Date().toLocaleString('en-US', {
      timeZone: 'Asia/Jakarta',
    });

    await this.activityLogService.logActivity({
      admin_id: user_id,
      action: 'Mengubah Data Temperatur Rata-Rata',
      description: `${namaAdmin} mengubah data temperatur rata-rata sebesar ${avg_temperature}°C, yang diukur pada pukul ${avg_temperature_07}, ${avg_temperature_13}, dan ${avg_temperature_18}.`,
      ip_address: ipAddress,
      user_agent: userAgent,
      created_at: createdAt,
    });

    return {
      success: true,
      message: 'Berhasil mengubah data temperatur rata rata',
      data: updatedAvgTemperature,
    };
  }

  /**
   * Menghapus data temperatur rata rata dan mencatat ke activity log
   */
  async deleteAverageTemperature(
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

    // 2. Ambil data temperatur rata rata (untuk log)
    const { data: avgTemperatureData, error: getAvgTemperatureError } =
      await this.supabase
        .from('average_temperature')
        .select('*')
        .eq('id', id)
        .single();

    if (getAvgTemperatureError) {
      return {
        success: false,
        message: 'Gagal mengambil data temperatur rata rata',
        error: getAvgTemperatureError,
      };
    }

    const {
      avg_temperature,
      avg_temperature_07,
      avg_temperature_13,
      avg_temperature_18,
    } = avgTemperatureData;

    // 3. Hapus data temperatur rata rata berdasarkan id
    const { error: deleteError } = await this.supabase
      .from('average_temperature')
      .delete()
      .eq('id', id);

    if (deleteError) {
      return {
        success: false,
        message: 'Gagal menghapus data temperatur rata rata',
        error: deleteError,
      };
    }

    // 4. Mencatat ke activity log
    const createdAt = new Date().toLocaleString('en-US', {
      timeZone: 'Asia/Jakarta',
    });

    await this.activityLogService.logActivity({
      admin_id: user_id,
      action: 'Menghapus Data Temperatur Rata-Rata',
      description: `${namaAdmin} menghapus data temperatur rata-rata sebesar ${avg_temperature}°C, yang diukur pada pukul ${avg_temperature_07}, ${avg_temperature_13}, dan ${avg_temperature_18}.`,
      ip_address: ipAddress,
      user_agent: userAgent,
      created_at: createdAt,
    });

    return {
      success: true,
      message: 'Berhasil menghapus data temperatur rata rata',
      data: avgTemperatureData,
    };
  }

  /**
   * Mengambil semua data temperatur rata rata
   */
  async getAllAverageTemperature() {
    const { data, error } = await this.supabase
      .from('average_temperature')
      .select('*');

    if (error || !data) {
      return {
        success: false,
        message: 'Gagal mengambil data temperatur rata rata',
        error,
      };
    }

    return {
      success: true,
      message: 'Berhasil mengambil semua data temperatur rata rata',
      data: data,
    };
  }

  /**
   * Mengambil semua data temperatur rata rata berdasarkan id
   */
  async getAverageTemperatureById(id: number) {
    const { data, error } = await this.supabase
      .from('average_temperature')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return {
        success: false,
        message: 'Gagal mengambil data temperatur rata rata berdasarkan id',
        error,
      };
    }

    return {
      success: true,
      message: 'Berhasil mengambil data temperatur rata rata berdasarkan id',
      data,
    };
  }

  /**
   * Mengambil data temperatur rata rata berdasarkan rentang temperatur rata rata
   */
  async getAverageTemperatureByAverageTemperature(
    dto: FilterAverageTemperatureByAverageTemperatureDto,
  ) {
    const { start_average_temperature, end_average_temperature } = dto;

    const { data, error } = await this.supabase
      .from('average_temperature')
      .select('*')
      .gte('avg_temperature', start_average_temperature)
      .lte('avg_temperature', end_average_temperature);

    if (error || !data) {
      return {
        success: false,
        message:
          'Gagal mengambil data temperatur rata rata berdasarkan rentang temperatur rata rata',
        error,
      };
    }

    return {
      success: true,
      message:
        'Berhasil mengambil data temperatur rata rata berdasarkan rentang temperatur rata rata',
      data,
    };
  }
}
