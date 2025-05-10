import * as dotenv from 'dotenv';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

import { EditRainfallDto } from '@/rainfall/dto/edit-rainfall.dto';
import { CreateRainfallDto } from '@/rainfall/dto/create-rainfall.dto';
import { ActivityLogService } from '@/activity-log/activity-log.service';
import { FilterRainfallByDateDto } from '@/rainfall/dto/filterRainfallByDateDto';

dotenv.config();

@Injectable()
export class RainfallService {
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
   * Menyimpan data curah hujan dan mencatat ke activity log
   */
  async saveRainfall(
    dto: CreateRainfallDto,
    ipAddress: string,
    userAgent: string,
  ) {
    const { user_id, date, rainfall } = dto;

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

    // 2. Simpan data curah hujan
    const { data: insertedRainfall, error: rainfallError } = await this.supabase
      .from('rainfall')
      .insert({ date, rainfall })
      .select();

    if (rainfallError || !insertedRainfall) {
      return {
        success: false,
        message: 'Gagal menyimpan data curah hujan',
        error: rainfallError,
      };
    }

    // 3. Mencatat ke activity log
    const createdAt = new Date().toLocaleString('en-US', {
      timeZone: 'Asia/Jakarta',
    });

    await this.activityLogService.logActivity({
      admin_id: user_id,
      action: 'Menambahkan Data Curah Hujan',
      description: `${namaAdmin} menambahkan data curah hujan dengan nilai ${rainfall} untuk tanggal ${date}`,
      ip_address: ipAddress,
      user_agent: userAgent,
      created_at: createdAt,
    });

    return {
      success: true,
      message: 'Berhasil menyimpan data curah hujan',
      data: insertedRainfall,
    };
  }

  /**
   * Mengubah data curah hujan dan mencatat ke activity log
   */
  async updateRainfall(
    dto: EditRainfallDto,
    ipAddress: string,
    userAgent: string,
  ) {
    const { id, user_id, date, rainfall } = dto;

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

    // 2. Update data curah hujan berdasarkan id
    const { data: updatedRainfall, error: rainfallError } = await this.supabase
      .from('rainfall')
      .update({ rainfall, date })
      .eq('id', id)
      .select();

    if (rainfallError || !updatedRainfall) {
      return {
        success: false,
        message: 'Gagal mengubah data curah hujan',
        error: rainfallError,
      };
    }

    // 3. Mencatat ke activity log
    const createdAt = new Date().toLocaleString('en-US', {
      timeZone: 'Asia/Jakarta',
    });

    await this.activityLogService.logActivity({
      admin_id: user_id,
      action: 'Mengubah Data Curah Hujan',
      description: `${namaAdmin} mengubah data curah hujan dengan nilai ${rainfall} untuk tanggal ${date}`,
      ip_address: ipAddress,
      user_agent: userAgent,
      created_at: createdAt,
    });

    return {
      success: true,
      message: 'Berhasil mengubah data curah hujan',
      data: updatedRainfall,
    };
  }

  /**
   * Menghapus data curah hujan dan mencatat ke activity log
   */
  async deleteRainfall(
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

    // 2. Ambil data curah hujan (untuk log)
    const { data: rainfallData, error: getRainfallError } = await this.supabase
      .from('rainfall')
      .select('*')
      .eq('id', id)
      .single();

    if (getRainfallError || !rainfallData) {
      return {
        success: false,
        message: 'Data curah hujan tidak ditemukan',
        error: getRainfallError,
      };
    }

    const { rainfall, date } = rainfallData;

    // 3. Hapus data curah hujan berdasarkan id
    const { error: rainfallError } = await this.supabase
      .from('rainfall')
      .delete()
      .eq('id', id)
      .select();

    if (rainfallError) {
      return {
        success: false,
        message: 'Gagal menghapus data curah hujan',
        error: rainfallError,
      };
    }

    // 4. Mencatat ke activity log
    const createdAt = new Date().toLocaleString('en-US', {
      timeZone: 'Asia/Jakarta',
    });

    await this.activityLogService.logActivity({
      admin_id: user_id,
      action: 'Menghapus Data Curah Hujan',
      description: `${namaAdmin} menghapus data curah hujan dengan nilai ${rainfall} untuk tanggal ${date}`,
      ip_address: ipAddress,
      user_agent: userAgent,
      created_at: createdAt,
    });

    return {
      success: true,
      message: 'Berhasil menghapus data curah hujan',
      data: rainfallData,
    };
  }

  /**
   * Mengambil semua data curah hujan
   */
  async getAllRainfall() {
    const { data, error } = await this.supabase.from('rainfall').select('*');

    if (error || !data) {
      return {
        success: false,
        message: 'Gagal mengambil data curah hujan',
        error,
      };
    }

    return {
      success: true,
      message: 'Berhasil mengambil semua data curah hujan',
      data: data,
    };
  }

  /**
   * Mengambil semua data curah hujan berdasarkan id
   */
  async getRainfallById(id: number) {
    const { data, error } = await this.supabase
      .from('rainfall')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return {
        success: false,
        message: 'Gagal mengambil data curah hujan berdasarkan id',
        error,
      };
    }

    return {
      success: true,
      message: 'Berhasil mengambil data curah hujan berdasarkan id',
      data,
    };
  }

  /**
   * Mengambil data curah hujan berdasarkan rentang tanggal
   */
  async getRainfallByDate(dto: FilterRainfallByDateDto) {
    const { start_date, end_date } = dto;

    const { data, error } = await this.supabase
      .from('rainfall')
      .select('*')
      .gte('date', start_date)
      .lte('date', end_date);

    if (error || !data) {
      return {
        success: false,
        message: 'Gagal mengambil data curah hujan berdasarkan rentang tanggal',
        error,
      };
    }

    return {
      success: true,
      message:
        'Berhasil mengambil data curah hujan berdasarkan rentang tanggal',
      data,
    };
  }
}
