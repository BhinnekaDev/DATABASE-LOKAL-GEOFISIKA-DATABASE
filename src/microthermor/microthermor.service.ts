import { Buffer } from 'buffer';
import * as dotenv from 'dotenv';
import * as ExcelJS from 'exceljs';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

import { ActivityLogService } from '@/activity-log/activity-log.service';
import { EditMicrothermorDto } from '@/microthermor/dto/edit-microthermor.dto';
import { CreateMicrothermorDto } from '@/microthermor/dto/create-microthermor.dto';
import { GetMicrothermorQueryByMinMaxTDOMDto } from '@/microthermor/dto/getMicrothermorQueryByMinMaxTDOMDto';

@Injectable()
export class MicrothermorService {
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
   * Menyimpan data mikrotermor dan mencatat ke activity log
   */
  async saveMicrothermor(
    dto: CreateMicrothermorDto,
    ipAddress: string,
    userAgent: string,
  ) {
    const { user_id, latitude, longitude, FO, AO, TDOM, KG } = dto;

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

    // 2. Simpan data mikrotermor dengan select()
    const { data: insertedMicrothermor, error: microthermorError } =
      await this.supabase
        .from('microthermor')
        .insert({
          latitude,
          longitude,
          FO,
          AO,
          TDOM,
          KG,
        })
        .select()
        .single();

    if (microthermorError) {
      return {
        success: false,
        message: 'Gagal menyimpan data mikrotermor',
        error: microthermorError,
      };
    }

    // 3. Catat ke activity log
    const createdAt = new Date().toLocaleString('en-US', {
      timeZone: 'Asia/Jakarta',
    });

    await this.activityLogService.logActivity({
      admin_id: user_id,
      action: 'Menambahkan Data Penguapan',
      description: `${namaAdmin} menambahkan data mikrotermor dengan latitude ${latitude}, longitude ${longitude}, FO ${FO}, AO ${AO}, TDOM ${TDOM}, dan KG ${KG}`,
      ip_address: ipAddress,
      user_agent: userAgent,
      created_at: createdAt,
    });

    return {
      success: true,
      message: 'Berhasil menyimpan data mikrotermor',
      data: insertedMicrothermor,
    };
  }

  /**
   * Mengubah data mikrotermor dan mencatat ke activity log
   */
  async updateMicrothermor(
    dto: EditMicrothermorDto,
    ipAddress: string,
    userAgent: string,
  ) {
    const { id, user_id, latitude, longitude, FO, AO, TDOM, KG } = dto;

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

    // 2. Update data mikrotermor berdasarkan id
    const { data: updatedMicrothermor, error: microthermorError } =
      await this.supabase
        .from('microthermor')
        .update({ latitude, longitude, FO, AO, TDOM, KG })
        .eq('id', id)
        .select()
        .single();

    if (microthermorError) {
      return {
        success: false,
        message: 'Gagal mengubah data mikrotermor',
        error: microthermorError,
      };
    }

    // 3. Catat ke activity log
    const updatedAt = new Date().toLocaleString('en-US', {
      timeZone: 'Asia/Jakarta',
    });

    await this.activityLogService.logActivity({
      admin_id: user_id,
      action: 'Mengubah Data Mikrotermor',
      description: `${namaAdmin} mengubah nilai latitude menjadi ${latitude}, longitude menjadi ${longitude}, FO menjadi ${FO}, AO menjadi ${AO}, TDOM menjadi ${TDOM}, dan KG menjadi ${KG}`,
      ip_address: ipAddress,
      user_agent: userAgent,
      created_at: updatedAt,
    });

    return {
      success: true,
      message: 'Berhasil memperbarui data mikrotermor',
      data: updatedMicrothermor,
    };
  }

  /**
   * Menghapus data mikrotermor dan mencatat ke activity log
   */
  async deleteMicrothermor(
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

    // 2. Ambil data mikrotermor (untuk log)
    const { data: microthermorData, error: getMicrothermorError } =
      await this.supabase
        .from('microthermor')
        .select('*')
        .eq('id', id)
        .single();

    if (getMicrothermorError || !microthermorData) {
      return {
        success: false,
        message: 'Data mikrotermor tidak ditemukan',
        error: getMicrothermorError,
      };
    }

    const { latitude, longitude, FO, AO, TDOM, KG } = microthermorData;

    // 3. Hapus data mikrotermor
    const { error: microthermorError } = await this.supabase
      .from('microthermor')
      .delete()
      .eq('id', id);

    if (microthermorError) {
      return {
        success: false,
        message: 'Gagal menghapus data mikrotermor',
        error: microthermorError,
      };
    }

    // 4. Catat ke activity log
    const deletedAt = new Date().toLocaleString('en-US', {
      timeZone: 'Asia/Jakarta',
    });

    await this.activityLogService.logActivity({
      admin_id: user_id,
      action: 'Menghapus Data Mikrotermor',
      description: `${namaAdmin} menghapus data mikrotermor dengan latitude ${latitude}, longitude ${longitude}, FO ${FO}, AO ${AO}, TDOM ${TDOM}, dan KG ${KG}`,
      ip_address: ipAddress,
      user_agent: userAgent,
      created_at: deletedAt,
    });

    return {
      success: true,
      message: 'Berhasil menghapus data mikrotermor',
      data: microthermorData,
    };
  }

  /**
   * Mengambil semua data mikrotermor
   */
  async getAllMicrothermor() {
    const { data, error } = await this.supabase
      .from('microthermor')
      .select(`*`);

    if (error || !data) {
      return {
        success: false,
        message: 'Gagal mengambil data mikrotermor',
        error,
      };
    }

    return {
      success: true,
      message: 'Berhasil mengambil semua data mikrotermor',
      data: data,
    };
  }

  /**
   * Mengambil semua data mikrotermor berdasarkan id
   */
  async getMicrothermorById(id: number) {
    const { data, error } = await this.supabase
      .from('microthermor')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return {
        success: false,
        message: 'Gagal mengambil data mikrotermor berdasarkan id',
        error,
      };
    }

    return {
      success: true,
      message: 'Berhasil mengambil data mikrotermor berdasarkan id',
      data,
    };
  }

  /**
   * Mengambil semua data mikrotermor berdasarkan min max tdom
   */
  async getMicrothermorByMaxMinTDOM(dto: GetMicrothermorQueryByMinMaxTDOMDto) {
    const { min_tdom, max_tdom } = dto;

    const { data, error } = await this.supabase
      .from('microthermor')
      .select('*')
      .gte('TDOM', min_tdom)
      .lte('TDOM', max_tdom);

    if (error || !data) {
      return {
        success: false,
        message: 'Gagal mengambil data mikrotermor berdasarkan min max tdom',
        error,
      };
    }

    return {
      success: true,
      message: 'Berhasil mengambil data mikrotermor berdasarkan min max tdom',
      data,
    };
  }
}
