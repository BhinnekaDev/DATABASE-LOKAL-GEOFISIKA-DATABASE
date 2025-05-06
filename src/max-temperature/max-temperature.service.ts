import * as dotenv from 'dotenv';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

import { ActivityLogService } from '@/activity-log/activity-log.service';
import { EditMaxTemperatureDto } from '@/max-temperature/dto/edit-max-temperature.dto';
import { CreateMaxTemperatureDto } from '@/max-temperature/dto/create-max-temperature.dto';

dotenv.config();

@Injectable()
export class MaxTemperatureService {
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
   * Menyimpan data temperatur maksimal dan mencatat ke activity log
   */
  async saveMaxTemperature(
    dto: CreateMaxTemperatureDto,
    ipAddress: string,
    userAgent: string,
  ) {
    const { user_id, date, max_temperature } = dto;

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

    // 2. Simpan data max temperatur
    const { data: insertedMaxTemperature, error: maxTemperatureError } =
      await this.supabase
        .from('max_temperature')
        .insert({
          date,
          max_temperature,
        })
        .select()
        .single();

    if (maxTemperatureError) {
      return {
        success: false,
        message: 'Gagal menyimpan data temperatur maksimal',
        error: maxTemperatureError,
      };
    }

    // 3. Mencatat ke activity log
    const createdAt = new Date().toLocaleString('en-US', {
      timeZone: 'Asia/Jakarta',
    });

    await this.activityLogService.logActivity({
      admin_id: user_id,
      action: 'Menambahkan Data Temperatur Maksimal',
      description: `${namaAdmin} menambahkan data temperatur maksimal dengan nilai ${max_temperature} untuk tanggal ${date}`,
      ip_address: ipAddress,
      user_agent: userAgent,
      created_at: createdAt,
    });

    return {
      success: true,
      message: 'Berhasil menyimpan data temperatur maksimal',
      data: insertedMaxTemperature,
    };
  }

  /**
   * Mengubah data temperatur maksimal dan mencatat ke activity log
   */
  async updateMaxTemperature(
    dto: EditMaxTemperatureDto,
    ipAddress: string,
    userAgent: string,
  ) {
    const { id, user_id, date, max_temperature } = dto;

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

    // 2. Simpan data max temperatur
    const { data: updatedMaxTemperature, error: maxTemperatureError } =
      await this.supabase
        .from('max_temperature')
        .update({ max_temperature, date })
        .eq('id', id)
        .select()
        .single();

    if (maxTemperatureError) {
      return {
        success: false,
        message: 'Gagal menyimpan data temperatur maksimal',
        error: maxTemperatureError,
      };
    }

    // 3. Mencatat ke activity log
    const createdAt = new Date().toLocaleString('en-US', {
      timeZone: 'Asia/Jakarta',
    });

    await this.activityLogService.logActivity({
      admin_id: user_id,
      action: 'Mengubah Data Temperatur Maksimal',
      description: `${namaAdmin} mengubah data temperatur maksimal dengan nilai ${max_temperature} untuk tanggal ${date}`,
      ip_address: ipAddress,
      user_agent: userAgent,
      created_at: createdAt,
    });

    return {
      success: true,
      message: 'Berhasil memperbaharui data temperatur maksimal',
      data: updatedMaxTemperature,
    };
  }

  /**
   * Menghapus data temperatur maksimal dan mencatat ke activity log
   */
  async deleteMaxTemperature(
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

    // 2. Ambil data temperatur maksimal (untuk log)
    const { data: maxTemperatureData, error: getMaxTemperatureError } =
      await this.supabase
        .from('max_temperature')
        .select('*')
        .eq('id', id)
        .single();

    if (getMaxTemperatureError) {
      return {
        success: false,
        message: 'Gagal mengambil data temperatur maksimal',
        error: getMaxTemperatureError,
      };
    }

    const { max_temperature, date } = maxTemperatureData;

    // 3. Hapus data max temperatur berdasarkan id
    const { error: maxTemperatureError } = await this.supabase
      .from('max_temperature')
      .delete()
      .eq('id', id)
      .select()
      .single();

    if (maxTemperatureError) {
      return {
        success: false,
        message: 'Gagal menghapus data temperatur maksimal',
        error: maxTemperatureError,
      };
    }

    // 4. Mencatat ke activity log
    const createdAt = new Date().toLocaleString('en-US', {
      timeZone: 'Asia/Jakarta',
    });

    await this.activityLogService.logActivity({
      admin_id: user_id,
      action: 'Menghapus Data Temperatur Maksimal',
      description: `${namaAdmin} menghapus data temperatur maksimal dengan nilai ${max_temperature} untuk tanggal ${date}`,
      ip_address: ipAddress,
      user_agent: userAgent,
      created_at: createdAt,
    });

    return {
      success: true,
      message: 'Berhasil menghapus data temperatur maksimal',
      data: maxTemperatureData,
    };
  }

  /**
   * Mengambil semua data temperatur maksimal
   */
  async getAllMaxTemperature() {
    const { data, error } = await this.supabase
      .from('max_temperature')
      .select('*');

    if (error || !data) {
      return {
        success: false,
        message: 'Gagal mengambil data temperatur maksimal',
        error,
      };
    }

    return {
      success: true,
      message: 'Berhasil mengambil semua data temperatur maksimal',
      data: data,
    };
  }

  /**
   * Mengambil semua data temperatur maksimal berdasarkan id
   */
  async getMaxTemperatureById(id: number) {
    const { data, error } = await this.supabase
      .from('max_temperature')
      .select(`*`)
      .eq('id', id)
      .single();

    if (error || !data) {
      return {
        success: false,
        message: 'Gagal mengambil data temperatur maksimal berdasarkan id',
        error,
      };
    }

    return {
      success: true,
      message: 'Berhasil mengambil data temperatur maksimal berdasarkan id',
      data,
    };
  }
}
