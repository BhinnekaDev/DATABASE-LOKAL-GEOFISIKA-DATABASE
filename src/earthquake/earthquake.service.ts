import * as dotenv from 'dotenv';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

import { EditEarthquakeDto } from '@/earthquake/dto/edit-earthquake.dto';
import { ActivityLogService } from '@/activity-log/activity-log.service';
import { CreateEarthquakeDto } from '@/earthquake/dto/create-earthquake.dto';
import { FilterEarthquakeByDateDto } from '@/earthquake/dto/filterEarthquakeByDateDto';

dotenv.config();

@Injectable()
export class EarthquakeService {
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
   * Menyimpan data gempa dan mencatat ke activity log
   */
  async saveEarthquake(
    dto: CreateEarthquakeDto,
    ipAddress: string,
    userAgent: string,
  ) {
    const {
      user_id,
      date,
      time,
      mmi,
      description,
      depth,
      latitude,
      longitude,
      magnitude,
      observer_name,
    } = dto;

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

    // 2. Simpan data gempa
    const { data: insertedEarthquake, error: earthquakeError } =
      await this.supabase
        .from('earthquake')
        .insert({
          date,
          time,
          mmi,
          description,
          depth,
          latitude,
          longitude,
          magnitude,
          observer_name,
        })
        .select();

    if (earthquakeError || !insertedEarthquake) {
      return {
        success: false,
        message: 'Gagal menyimpan data gempa',
        error: earthquakeError ? earthquakeError.message : 'Unknown error',
      };
    }

    // 3. Mencatat ke activity log
    const createdAt = new Date().toLocaleString('en-US', {
      timeZone: 'Asia/Jakarta',
    });

    await this.activityLogService.logActivity({
      admin_id: user_id,
      action: 'Menambahkan Data Gempa',
      description: `${namaAdmin} menambahkan data gempa dengan tingkat intensitas ${mmi}, terdeteksi pada koordinat (${latitude}, ${longitude}), dengan kedalaman ${depth} km.`,
      ip_address: ipAddress,
      user_agent: userAgent,
      created_at: createdAt,
    });

    return {
      success: true,
      message: 'Berhasil menyimpan data gempa',
      data: insertedEarthquake,
    };
  }

  /**
   * Mengubah data gempa dan mencatat ke activity log
   */
  async updateEarthquake(
    dto: EditEarthquakeDto,
    ipAddress: string,
    userAgent: string,
  ) {
    const {
      id,
      user_id,
      date,
      time,
      mmi,
      description,
      depth,
      latitude,
      longitude,
      magnitude,
      observer_name,
    } = dto;

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

    // 2. Update data gempa berdasarkan id
    const { data: updatedEarthquake, error: earthquakeError } =
      await this.supabase
        .from('earthquake')
        .update({
          date,
          time,
          mmi,
          description,
          depth,
          latitude,
          longitude,
          magnitude,
          observer_name,
        })
        .eq('id', id)
        .select();

    if (earthquakeError || !updatedEarthquake) {
      return {
        success: false,
        message: 'Gagal mengubah data gempa',
        error: earthquakeError ? earthquakeError.message : 'Unknown error',
      };
    }

    // 3. Mencatat ke activity log
    const createdAt = new Date().toLocaleString('en-US', {
      timeZone: 'Asia/Jakarta',
    });

    await this.activityLogService.logActivity({
      admin_id: user_id,
      action: 'Mengubah Data Gempa',
      description: `${namaAdmin} mengubah data gempa dengan tingkat intensitas ${mmi}, terdeteksi pada koordinat (${latitude}, ${longitude}), dengan kedalaman ${depth} km.`,
      ip_address: ipAddress,
      user_agent: userAgent,
      created_at: createdAt,
    });

    return {
      success: true,
      message: 'Berhasil mengubah data gempa',
      data: updatedEarthquake,
    };
  }

  /**
   * Menghapus data gempa dan mencatat ke activity log
   */
  async deleteEarthquake(
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

    // 2. Ambil data gempa (untuk log)
    const { data: earthquakeData, error: getEarthquakeError } =
      await this.supabase.from('earthquake').select('*').eq('id', id).single();

    if (getEarthquakeError || !earthquakeData) {
      return {
        success: false,
        message: 'Data gempa tidak ditemukan',
        error: getEarthquakeError
          ? getEarthquakeError.message
          : 'Unknown error',
      };
    }

    const { mmi, depth, latitude, longitude } = earthquakeData;

    // 3. Hapus gempa hujan berdasarkan id
    const { error: deleteEarthquakeError } = await this.supabase
      .from('earthquake')
      .delete()
      .eq('id', id);

    if (deleteEarthquakeError) {
      return {
        success: false,
        message: 'Gagal menghapus data gempa',
        error: deleteEarthquakeError.message,
      };
    }

    // 4. Mencatat ke activity log
    const createdAt = new Date().toLocaleString('en-US', {
      timeZone: 'Asia/Jakarta',
    });

    await this.activityLogService.logActivity({
      admin_id: user_id,
      action: 'Menghapus Data Gempa',
      description: `${namaAdmin} menghapus data gempa dengan tingkat intensitas ${mmi}, terdeteksi pada koordinat (${latitude}, ${longitude}), dengan kedalaman ${depth} km.`,
      ip_address: ipAddress,
      user_agent: userAgent,
      created_at: createdAt,
    });

    return {
      success: true,
      message: 'Berhasil menghapus data gempa',
      data: earthquakeData,
    };
  }

  /**
   * Mengambil semua data gempa
   */
  async getAllEarthquake() {
    const { data, error } = await this.supabase.from('earthquake').select('*');

    if (error || !data) {
      return {
        success: false,
        message: 'Gagal mengambil data gempa',
        error,
      };
    }

    return {
      success: true,
      message: 'Berhasil mengambil semua data gempa',
      data: data,
    };
  }

  /**
   * Mengambil semua data gempa berdasarkan id
   */
  async getEarthquakeById(id: number) {
    const { data, error } = await this.supabase
      .from('earthquake')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return {
        success: false,
        message: 'Gagal mengambil data gempa berdasarkan id',
        error,
      };
    }

    return {
      success: true,
      message: 'Berhasil mengambil data gempa berdasarkan id',
      data,
    };
  }

  /**
   * Mengambil data gempa berdasarkan rentang tanggal
   */
  async getEarthquakeByDate(dto: FilterEarthquakeByDateDto) {
    const { start_date, end_date } = dto;

    const { data, error } = await this.supabase
      .from('earthquake')
      .select('*')
      .gte('date', start_date)
      .lte('date', end_date);

    if (error || !data) {
      return {
        success: false,
        message: 'Gagal mengambil data gempa berdasarkan rentang tanggal',
        error,
      };
    }

    return {
      success: true,
      message: 'Berhasil mengambil data gempa berdasarkan rentang tanggal',
      data,
    };
  }
}
