import * as dotenv from 'dotenv';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

import { ActivityLogService } from '@/activity-log/activity-log.service';
import { EditEvaporationDto } from '@/evaporation/dto/edit-evaporation.dto';
import { CreateEvaporationDto } from '@/evaporation/dto/create-evaporation.dto';
import { FilterEvaporationByDateDto } from '@/evaporation/dto/filterEvaporationByDateDto';

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
   * Menyimpan data penguapan dan mencatat ke activity log
   */
  async saveEvaporation(
    dto: CreateEvaporationDto,
    ipAddress: string,
    userAgent: string,
  ) {
    const { user_id, date, evaporation } = dto;

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

    // 2. Simpan data evaporation dengan select()
    const { data: insertedEvaporation, error: evaporationError } =
      await this.supabase
        .from('evaporation')
        .insert({
          date,
          evaporation,
        })
        .select()
        .single();

    if (evaporationError) {
      return {
        success: false,
        message: 'Gagal menyimpan data penguapan',
        error: evaporationError,
      };
    }

    // 3. Catat ke activity log
    const createdAt = new Date().toLocaleString('en-US', {
      timeZone: 'Asia/Jakarta',
    });

    await this.activityLogService.logActivity({
      admin_id: user_id,
      action: 'Menambahkan Data Penguapan',
      description: `${namaAdmin} menambahkan data penguapan dengan nilai ${evaporation} untuk tanggal ${date}`,
      ip_address: ipAddress,
      user_agent: userAgent,
      created_at: createdAt,
    });

    return {
      success: true,
      message: 'Berhasil menyimpan data penguapan',
      data: insertedEvaporation,
    };
  }

  /**
   * Mengubah data penguapan dan mencatat ke activity log
   */
  async updateEvaporation(
    dto: EditEvaporationDto,
    ipAddress: string,
    userAgent: string,
  ) {
    const { id, user_id, date, evaporation } = dto;

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

    // 2. Update data evaporation berdasarkan id
    const { data: updatedEvaporation, error: evaporationError } =
      await this.supabase
        .from('evaporation')
        .update({ evaporation, date })
        .eq('id', id)
        .select()
        .single();

    if (evaporationError) {
      return {
        success: false,
        message: 'Gagal mengubah data penguapan',
        error: evaporationError,
      };
    }

    // 3. Catat ke activity log
    const updatedAt = new Date().toLocaleString('en-US', {
      timeZone: 'Asia/Jakarta',
    });

    await this.activityLogService.logActivity({
      admin_id: user_id,
      action: 'Mengubah Data Penguapan',
      description: `${namaAdmin} mengubah nilai penguapan menjadi ${evaporation} untuk tanggal ${date}`,
      ip_address: ipAddress,
      user_agent: userAgent,
      created_at: updatedAt,
    });

    return {
      success: true,
      message: 'Berhasil memperbarui data penguapan',
      data: updatedEvaporation,
    };
  }

  /**
   * Menghapus data penguapan dan mencatat ke activity log
   */
  async deleteEvaporation(
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

    // 2. Ambil data penguapan (untuk log)
    const { data: evaporationData, error: getEvaporationError } =
      await this.supabase.from('evaporation').select('*').eq('id', id).single();

    if (getEvaporationError || !evaporationData) {
      return {
        success: false,
        message: 'Data evaporation tidak ditemukan',
        error: getEvaporationError,
      };
    }

    const { date, evaporation } = evaporationData;

    // 3. Hapus data evaporation
    const { error: evaporationError } = await this.supabase
      .from('evaporation')
      .delete()
      .eq('id', id);

    if (evaporationError) {
      return {
        success: false,
        message: 'Gagal menghapus data penguapan',
        error: evaporationError,
      };
    }

    // 4. Catat ke activity log
    const deletedAt = new Date().toLocaleString('en-US', {
      timeZone: 'Asia/Jakarta',
    });

    await this.activityLogService.logActivity({
      admin_id: user_id,
      action: 'Menghapus Data Penguapan',
      description: `${namaAdmin} menghapus data penguapan dengan nilai ${evaporation} untuk tanggal ${date}`,
      ip_address: ipAddress,
      user_agent: userAgent,
      created_at: deletedAt,
    });

    return {
      success: true,
      message: 'Berhasil menghapus data penguapan',
      data: evaporationData,
    };
  }

  /**
   * Mengambil semua data evaporation
   */
  async getAllEvaporation() {
    const { data, error } = await this.supabase.from('evaporation').select(`*`);

    if (error || !data) {
      return {
        success: false,
        message: 'Gagal mengambil data penguapan',
        error,
      };
    }

    return {
      success: true,
      message: 'Berhasil mengambil semua data penguapan',
      data: data,
    };
  }

  /**
   * Mengambil semua data evaporation berdasarkan id
   */
  async getEvaporationById(id: number) {
    const { data, error } = await this.supabase
      .from('evaporation')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return {
        success: false,
        message: 'Gagal mengambil data penguapan berdasarkan id',
        error,
      };
    }

    return {
      success: true,
      message: 'Berhasil mengambil data penguapan berdasarkan id',
      data,
    };
  }

  /**
   * Mengambil data penguapan berdasarkan rentang tanggal
   */
  async getEvaporationByDate(dto: FilterEvaporationByDateDto) {
    const { start_date, end_date } = dto;

    const { data, error } = await this.supabase
      .from('evaporation')
      .select('*')
      .gte('date', start_date)
      .lte('date', end_date);

    if (error || !data) {
      return {
        success: false,
        message: 'Gagal mengambil data penguapan berdasarkan rentang tanggal',
        error,
      };
    }

    return {
      success: true,
      message: 'Berhasil mengambil data penguapan berdasarkan rentang tanggal',
      data,
    };
  }
}
