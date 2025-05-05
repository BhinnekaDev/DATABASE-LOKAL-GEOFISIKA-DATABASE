import * as dotenv from 'dotenv';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

import { EditRainyDaysDto } from '@/rainy-days/dto/edit-rainy-days.dto';
import { ActivityLogService } from '@/activity-log/activity-log.service';
import { CreateRainyDaysDto } from '@/rainy-days/dto/create-rainy-days.dto';

dotenv.config();

@Injectable()
export class RainyDaysService {
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
   * Menyimpan data hari hujan dan mencatat ke activity log
   */
  async saveRainyDays(
    dto: CreateRainyDaysDto,
    ipAddress: string,
    userAgent: string,
  ) {
    const { user_id, date, rainy_day } = dto;

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
    const { data: insertedRainyDays, error: rainyDaysError } =
      await this.supabase
        .from('rainy_days')
        .insert({ date, rainy_day })
        .select();

    if (rainyDaysError) {
      return {
        success: false,
        message: 'Gagal menyimpan data hari hujan',
        error: rainyDaysError,
      };
    }

    // 3. Catat ke activity log
    const createdAt = new Date().toLocaleString('en-US', {
      timeZone: 'Asia/Jakarta',
    });

    await this.activityLogService.logActivity({
      admin_id: user_id,
      action: 'Menambahkan data temperatur minimal',
      description: `${namaAdmin} Mengubah data temperatur minimal dengan nilai ${rainy_day} untuk tanggal ${date}`,
      ip_address: ipAddress,
      user_agent: userAgent,
      created_at: createdAt,
    });

    return {
      success: true,
      message: 'Berhasil menyimpan data hari hujan',
      data: insertedRainyDays,
    };
  }

  /**
   * Mengubah data hari hujan dan mencatat ke activity log
   */
  async updateRainyDays(
    dto: EditRainyDaysDto,
    ipAddress: string,
    userAgent: string,
  ) {
    const { id, user_id, date, rainy_day } = dto;

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

    // 2. Update data hari hujan berdasarkan id
    const { data: updatedRainyDays, error: rainyDaysError } =
      await this.supabase
        .from('rainy_days')
        .update({ rainy_day, date })
        .eq('id', id)
        .select();

    if (rainyDaysError) {
      return {
        success: false,
        message: 'Gagal mengubah data hari hujan',
        error: rainyDaysError,
      };
    }

    // 3. Catat ke activity log
    const createdAt = new Date().toLocaleString('en-US', {
      timeZone: 'Asia/Jakarta',
    });

    await this.activityLogService.logActivity({
      admin_id: user_id,
      action: 'Mengubah data hari hujan',
      description: `${namaAdmin} Mengubah data hari hujan dengan nilai ${rainy_day} untuk tanggal ${date}`,
      ip_address: ipAddress,
      user_agent: userAgent,
      created_at: createdAt,
    });

    return {
      success: true,
      message: 'Berhasil mengubah data hari hujan',
      data: updatedRainyDays,
    };
  }

  /**
   * Menghapus data hari hujan dan mencatat ke activity log
   */
  async deleteRainyDays(
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

    // 2. Hapus data hari hujan berdasarkan id
    const { error: rainyDaysError } = await this.supabase
      .from('rainy_days')
      .delete()
      .eq('id', id);

    if (rainyDaysError) {
      return {
        success: false,
        message: 'Gagal menghapus data hari hujan',
        error: rainyDaysError,
      };
    }

    // 3. Catat ke activity log
    const createdAt = new Date().toLocaleString('en-US', {
      timeZone: 'Asia/Jakarta',
    });

    await this.activityLogService.logActivity({
      admin_id: user_id,
      action: 'Menghapus data hari hujan',
      description: `${namaAdmin} Menghapus data hari hujan dengan id ${id}`,
      ip_address: ipAddress,
      user_agent: userAgent,
      created_at: createdAt,
    });

    return {
      success: true,
      message: 'Berhasil menghapus data hari hujan',
    };
  }

  /**
   * Mengambil semua data hari hujan
   */
  async getAllRainyDays() {
    const { data, error } = await this.supabase.from('rainy_days').select('*');

    if (error || !data) {
      return {
        success: false,
        message: 'Gagal mengambil semua data hari hujan',
        error,
      };
    }

    return {
      success: true,
      message: 'Berhasil mengambil semua data hari hujan',
      data: data,
    };
  }

  /**
   * Mengambil semua data temperatur minimal berdasarkan id
   */
  async getRainyDaysById(id: number) {
    const { data, error } = await this.supabase
      .from('rainy_days')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return {
        success: false,
        message: 'Gagal mengambil data hari hujan berdasarkan id',
        error,
      };
    }

    return {
      success: true,
      message: 'Berhasil mengambil data hari hujan berdasarkan id',
      data,
    };
  }
}
