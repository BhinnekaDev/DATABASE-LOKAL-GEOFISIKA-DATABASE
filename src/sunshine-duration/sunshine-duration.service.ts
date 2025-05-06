import * as dotenv from 'dotenv';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

import { ActivityLogService } from '@/activity-log/activity-log.service';
import { EditSunshineDurationDto } from '@/sunshine-duration/dto/edit-sunshine-duration.dto';
import { CreateSunshineDurationDto } from '@/sunshine-duration/dto/create-sunshine-duration.dto';

dotenv.config();

@Injectable()
export class SunshineDurationService {
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
   * Menyimpan data durasi matahari terbit dan mencatat ke activity log
   */
  async saveSunshineDuration(
    dto: CreateSunshineDurationDto,
    ipAddress: string,
    userAgent: string,
  ) {
    const { user_id, date, sunshine_duration } = dto;

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

    // 2. Simpan data hari hujan
    const { data: insertedSunshineDurationDays, error: sunshineDurationError } =
      await this.supabase
        .from('sunshine_duration')
        .insert({ date, sunshine_duration })
        .select();

    if (sunshineDurationError) {
      return {
        success: false,
        message: 'Gagal menyimpan data durasi matahari terbit',
        error: sunshineDurationError,
      };
    }

    // 3. Catat ke activity log
    const createdAt = new Date().toLocaleString('en-US', {
      timeZone: 'Asia/Jakarta',
    });

    await this.activityLogService.logActivity({
      admin_id: user_id,
      action: 'Menambahkan Data Durasi Matahari Terbit',
      description: `${namaAdmin} menambahkan data durasi matahari terbit dengan nilai ${sunshine_duration} untuk tanggal ${date}`,
      ip_address: ipAddress,
      user_agent: userAgent,
      created_at: createdAt,
    });

    return {
      success: true,
      message: 'Berhasil menyimpan data durasi matahari terbit',
      data: insertedSunshineDurationDays,
    };
  }

  /**
   * Mengubah data durasi matahari terbit dan mencatat ke activity log
   */
  async updateSunshineDuration(
    dto: EditSunshineDurationDto,
    ipAddress: string,
    userAgent: string,
  ) {
    const { id, user_id, date, sunshine_duration } = dto;

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

    // 2. Update data durasi matahari terbit berdasarkan id
    const { data: updatedSunshineDurationDays, error: sunshineDurationError } =
      await this.supabase
        .from('sunshine_duration')
        .update({ sunshine_duration, date })
        .eq('id', id)
        .select();

    if (sunshineDurationError) {
      return {
        success: false,
        message: 'Gagal mengubah data durasi matahari terbit',
        error: sunshineDurationError,
      };
    }

    // 3. Mencatat ke activity log
    const createdAt = new Date().toLocaleString('en-US', {
      timeZone: 'Asia/Jakarta',
    });

    await this.activityLogService.logActivity({
      admin_id: user_id,
      action: 'Mengubah Data Durasi Matahari Terbit',
      description: `${namaAdmin} mengubah data durasi matahari terbit dengan nilai ${sunshine_duration} untuk tanggal ${date}`,
      ip_address: ipAddress,
      user_agent: userAgent,
      created_at: createdAt,
    });

    return {
      success: true,
      message: 'Berhasil mengubah data durasi matahari terbit',
      data: updatedSunshineDurationDays,
    };
  }

  /**
   * Menghapus data durasi matahari terbit dan mencatat ke activity log
   */
  async deleteSunshineDuration(
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

    // 2. Ambil data durasi matahari terbit (untuk log)
    const { data: sunshineDurationData, error: getSunshineDurationError } =
      await this.supabase
        .from('sunshine_duration')
        .select('*')
        .eq('id', id)
        .single();

    if (getSunshineDurationError || !sunshineDurationData) {
      return {
        success: false,
        message: 'Data durasi matahari terbit tidak ditemukan',
        error: getSunshineDurationError,
      };
    }

    const { date, sunshine_duration } = sunshineDurationData;

    // 3. Hapus data durasi matahari terbit berdasarkan id
    const { error: sunshineDurationError } = await this.supabase
      .from('sunshine_duration')
      .delete()
      .eq('id', id);

    if (sunshineDurationError) {
      return {
        success: false,
        message: 'Gagal menghapus data durasi matahari terbit',
        error: sunshineDurationError,
      };
    }

    // 4. Mencatat ke activity log
    const createdAt = new Date().toLocaleString('en-US', {
      timeZone: 'Asia/Jakarta',
    });

    await this.activityLogService.logActivity({
      admin_id: user_id,
      action: 'Menghapus Data Durasi Matahari Terbit',
      description: `${namaAdmin} menghapus data durasi matahari terbit dengan nilai ${sunshine_duration} untuk tanggal ${date}`,
      ip_address: ipAddress,
      user_agent: userAgent,
      created_at: createdAt,
    });

    return {
      success: true,
      message: 'Berhasil menghapus data durasi matahari terbit',
      data: sunshineDurationData,
    };
  }

  /**
   * Mengambil semua data durasi matahari terbit
   */
  async getAllSunshineDuration() {
    const { data, error } = await this.supabase
      .from('sunshine_duration')
      .select('*');

    if (error || !data) {
      return {
        success: false,
        message: 'Gagal mengambil data durasi matahari terbit',
        error,
      };
    }

    return {
      success: true,
      message: 'Berhasil mengambil semua data durasi matahari terbit',
      data: data,
    };
  }

  /**
   * Mengambil semua data durasi matahari terbit berdasarkan id
   */
  async getSunshineDurationById(id: number) {
    const { data, error } = await this.supabase
      .from('sunshine_duration')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return {
        success: false,
        message: 'Gagal mengambil data durasi matahari terbit berdasarkan id',
        error,
      };
    }

    return {
      success: true,
      message: 'Berhasil mengambil data durasi matahari terbit berdasarkan id',
      data,
    };
  }
}
