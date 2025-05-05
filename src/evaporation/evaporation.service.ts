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
        message: 'Gagal menyimpan data evaporation',
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
      description: `${namaAdmin} Menambahkan data penguapan dengan nilai ${evaporation} untuk tanggal ${date}`,
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
        message: 'Gagal mengubah data evaporation',
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
      message: 'Data penguapan berhasil diubah',
      data: updatedEvaporation,
    };
  }

  /**
   * Menghapus data evaporation, lalu mencatat ke activity log
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

    // 3. Ambil data evaporation (untuk log)
    const { data: evaporationData, error: getEvaporationError } =
      await this.supabase
        .from('evaporation')
        .select('id, evaporation, date')
        .eq('id', id)
        .single();

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
        message: 'Gagal menghapus data evaporation',
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
      message: 'Data evaporation dan tanggal berhasil dihapus',
      data: evaporationData,
    };
  }

  /**
   * Mengambil semua data evaporation
   */
  async getAllEvaporation() {
    const { data, error } = await this.supabase.from('evaporation').select(`
        id,
        evaporation,
        date
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
        date
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
