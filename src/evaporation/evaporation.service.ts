import * as dotenv from 'dotenv';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

import { ActivityLogService } from '@/activity-log/activity-log.service';
import { EditEvaporationDto } from '@/evaporation/dto/edit-evaporation.dto';
import { CreateEvaporationDto } from '@/evaporation/dto/create-evaporation.dto';

dotenv.config();

@Injectable()
export class EvaporationService {
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
   * Menyimpan data evaporation dan mencatat ke activity log
   */
  async saveEvaporation(
    dto: CreateEvaporationDto,
    ipAddress: string,
    userAgent: string,
  ) {
    const { user_id, date, evaporation } = dto;

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

    // 3. Simpan data evaporation dengan select()
    const { data: insertedEvaporation, error: evaporationError } =
      await this.supabase
        .from('evaporation')
        .insert({
          id_date: tanggalData.id,
          evaporation,
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

    // 4. Catat ke activity log
    const createdAt = new Date().toLocaleString('en-US', {
      timeZone: 'Asia/Jakarta',
    });

    await this.activityLogService.logActivity({
      admin_id: user_id,
      action: 'Menambahkan Data Evaporation',
      description: `${namaAdmin} Menambahkan data evaporation dengan nilai ${evaporation} untuk tanggal ${date}`,
      ip_address: ipAddress,
      user_agent: userAgent,
      created_at: createdAt,
    });

    return {
      success: true,
      message: 'Data evaporation berhasil disimpan',
      data: insertedEvaporation,
    };
  }

  /**
   * Mengubah data evaporation dan mencatat ke activity log
   */
  async updateEvaporation(
    dto: EditEvaporationDto,
    ipAddress: string,
    userAgent: string,
  ) {
    const { id_date, user_id, date, evaporation } = dto;

    // 1. Cek apakah tanggal ada di tabel date_data
    const { data: tanggalData, error: tanggalError } = await this.supabase
      .from('date_data')
      .select('id')
      .eq('id', id_date)
      .single();

    if (tanggalError || !tanggalData) {
      return {
        success: false,
        message: 'Tanggal dengan id_date tersebut tidak ditemukan',
        error: tanggalError,
      };
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

    // 3. Update data evaporation berdasarkan id_date
    const { error: evaporationError } = await this.supabase
      .from('evaporation')
      .update({ evaporation })
      .eq('id_date', id_date);

    if (evaporationError) {
      return {
        success: false,
        message: 'Gagal mengubah data evaporation',
        error: evaporationError,
      };
    }

    // 4. Update tanggal
    const { error: updateDateError } = await this.supabase
      .from('date_data')
      .update({ date })
      .eq('id', id_date);

    if (updateDateError) {
      return {
        success: false,
        message: 'Gagal mengubah tanggal di date_data',
        error: updateDateError,
      };
    }

    // 5. Catat ke activity log
    const updatedAt = new Date().toLocaleString('en-US', {
      timeZone: 'Asia/Jakarta',
    });

    await this.activityLogService.logActivity({
      admin_id: user_id,
      action: 'Mengubah Data Evaporation',
      description: `${namaAdmin} mengubah nilai evaporation menjadi ${evaporation} untuk tanggal ${date}`,
      ip_address: ipAddress,
      user_agent: userAgent,
      created_at: updatedAt,
    });

    return {
      message: 'Data evaporation berhasil diubah',
      data: evaporation,
    };
  }

  /**
   * Menghapus data evaporation dan tanggal terkait, lalu mencatat ke activity log
   */
  async deleteEvaporation(
    id_date: number,
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

    // 2. Ambil tanggal sebelum menghapus (untuk log)
    const { data: tanggalData, error: tanggalError } = await this.supabase
      .from('date_data')
      .select('date')
      .eq('id', id_date)
      .single();

    if (tanggalError || !tanggalData) {
      return {
        success: false,
        message: 'Tanggal tidak ditemukan di date_data',
        error: tanggalError,
      };
    }

    const tanggal = tanggalData.date;

    // 3. Hapus data evaporation
    const { error: evaporationError } = await this.supabase
      .from('evaporation')
      .delete()
      .eq('id_date', id_date);

    if (evaporationError) {
      return {
        success: false,
        message: 'Gagal menghapus data evaporation',
        error: evaporationError,
      };
    }

    // 4. Hapus data date_data
    const { error: dateDeleteError } = await this.supabase
      .from('date_data')
      .delete()
      .eq('id', id_date);

    if (dateDeleteError) {
      return {
        success: false,
        message: 'Gagal menghapus data tanggal dari date_data',
        error: dateDeleteError,
      };
    }

    // 5. Catat ke activity log
    const deletedAt = new Date().toLocaleString('en-US', {
      timeZone: 'Asia/Jakarta',
    });

    await this.activityLogService.logActivity({
      admin_id: user_id,
      action: 'Menghapus Data Evaporation',
      description: `${namaAdmin} menghapus data evaporation untuk tanggal ${tanggal}`,
      ip_address: ipAddress,
      user_agent: userAgent,
      created_at: deletedAt,
    });

    return {
      success: true,
      message: 'Data evaporation dan tanggal berhasil dihapus',
    };
  }

  /**
   * Mengambil semua data evaporation
   */
  async getAllEvaporation() {
    const { data, error } = await this.supabase.from('evaporation').select(`
        id,
        evaporation,
        id_date,
        date_data (
          date
        )
      `);

    if (error || !data) {
      return {
        success: false,
        message: 'Gagal mengambil data evaporation',
        error,
      };
    }

    return {
      success: true,
      message: 'Berhasil mengambil semua data evaporation',
      data: data,
    };
  }

  /**
   * Mengambil semua data evaporation berdasarkan id
   */
  async getEvaporationById(id: number) {
    const { data, error } = await this.supabase
      .from('evaporation')
      .select(
        `
        id,
        evaporation,
        id_date,
        date_data (
          date
        )
      `,
      )
      .eq('id', id)
      .single();

    if (error || !data) {
      return {
        success: false,
        message: 'Gagal mengambil data evaporation berdasarkan id',
        error,
      };
    }

    return {
      success: true,
      message: 'Berhasil mengambil data evaporation berdasarkan id',
      data,
    };
  }
}
