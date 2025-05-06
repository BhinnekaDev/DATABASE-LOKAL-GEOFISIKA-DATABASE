import * as dotenv from 'dotenv';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

import { ActivityLogService } from '@/activity-log/activity-log.service';
import { EditMinTemperatureDto } from '@/min-temperature/dto/edit-min-temperature.dto';
import { CreateMinTemperatureDto } from '@/min-temperature/dto/create-min-temperature.dto';

dotenv.config();

@Injectable()
export class MinTemperatureService {
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
   * Menyimpan data temperatur minimal dan mencatat ke activity log
   */
  async saveMinTemperature(
    dto: CreateMinTemperatureDto,
    ipAddress: string,
    userAgent: string,
  ) {
    const { user_id, date, min_temperature } = dto;

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

    // 2. Simpan data min temperatur
    const { data: insertedMinTemperature, error: minTemperatureError } =
      await this.supabase
        .from('min_temperature')
        .insert({ date, min_temperature })
        .select();

    if (minTemperatureError) {
      return {
        success: false,
        message: 'Gagal menyimpan data temperatur minimal',
        error: minTemperatureError,
      };
    }

    // 3. Mencatat ke activity log
    const createdAt = new Date().toLocaleString('en-US', {
      timeZone: 'Asia/Jakarta',
    });

    await this.activityLogService.logActivity({
      admin_id: user_id,
      action: 'Menambahkan Data Temperatur Minimal',
      description: `${namaAdmin} menambahkan data temperatur minimal dengan nilai ${min_temperature} untuk tanggal ${date}`,
      ip_address: ipAddress,
      user_agent: userAgent,
      created_at: createdAt,
    });

    return {
      success: true,
      message: 'Berhasil menyimpan data temperatur minimal',
      data: insertedMinTemperature,
    };
  }

  /**
   * Mengubah data temperatur minimal dan mencatat ke activity log
   */
  async updateMinTemperature(
    dto: EditMinTemperatureDto,
    ipAddress: string,
    userAgent: string,
  ) {
    const { id, user_id, date, min_temperature } = dto;

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

    // 2. Update data min temperatur berdasarkan id
    const { data: updatedMinTemperature, error: minTemperatureError } =
      await this.supabase
        .from('min_temperature')
        .update({ min_temperature, date })
        .eq('id', id)
        .select();

    if (minTemperatureError) {
      return {
        success: false,
        message: 'Gagal mengubah data temperatur minimal',
        error: minTemperatureError,
      };
    }

    // 3. Mencatat ke activity log
    const createdAt = new Date().toLocaleString('en-US', {
      timeZone: 'Asia/Jakarta',
    });

    await this.activityLogService.logActivity({
      admin_id: user_id,
      action: 'Mengubah Data Temperatur Minimal',
      description: `${namaAdmin} mengubah data temperatur minimal dengan nilai ${min_temperature} untuk tanggal ${date}`,
      ip_address: ipAddress,
      user_agent: userAgent,
      created_at: createdAt,
    });

    return {
      success: true,
      message: 'Berhasil mengubah data temperatur minimal',
      data: updatedMinTemperature,
    };
  }

  /**
   * Menghapus data temperatur minimal dan mencatat ke activity log
   */
  async deleteMinTemperature(
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

    // 2. Ambil data temperatur minimal (untuk log)
    const { data: minTemperatureData, error: getMintemperatureError } =
      await this.supabase
        .from('min_temperature')
        .select('*')
        .eq('id', id)
        .single();

    if (getMintemperatureError) {
      return {
        success: false,
        message: 'Gagal mengambil data temperatur minimal',
        error: getMintemperatureError,
      };
    }

    const { min_temperature, date } = minTemperatureData;

    // 3. Hapus data min temperatur berdasarkan id
    const { error: minTemperatureError } = await this.supabase
      .from('min_temperature')
      .delete()
      .eq('id', id);

    if (minTemperatureError) {
      return {
        success: false,
        message: 'Gagal menghapus data temperatur minimal',
        error: minTemperatureError,
      };
    }

    // 4. Mencatat ke activity log
    const createdAt = new Date().toLocaleString('en-US', {
      timeZone: 'Asia/Jakarta',
    });

    await this.activityLogService.logActivity({
      admin_id: user_id,
      action: 'Menghapus Data Temperatur Minimal',
      description: `${namaAdmin} menghapus data temperatur minimal dengan nilai ${min_temperature} untuk tanggal ${date}`,
      ip_address: ipAddress,
      user_agent: userAgent,
      created_at: createdAt,
    });

    return {
      success: true,
      message: 'Berhasil menghapus data temperatur minimal',
      data: minTemperatureData,
    };
  }

  /**
   * Mengambil semua data temperatur minimal
   */
  async getAllMinTemperature() {
    const { data, error } = await this.supabase
      .from('min_temperature')
      .select('*');

    if (error || !data) {
      return {
        success: false,
        message: 'Gagal mengambil data temperatur minimal',
        error,
      };
    }

    return {
      success: true,
      message: 'Berhasil mengambil semua data temperatur minimal',
      data: data,
    };
  }

  /**
   * Mengambil semua data temperatur minimal berdasarkan id
   */
  async getMinTemperatureById(id: number) {
    const { data, error } = await this.supabase
      .from('min_temperature')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return {
        success: false,
        message: 'Gagal mengambil data temperatur minimal berdasarkan id',
        error,
      };
    }

    return {
      success: true,
      message: 'Berhasil mengambil data temperatur minimal berdasarkan id',
      data,
    };
  }
}
