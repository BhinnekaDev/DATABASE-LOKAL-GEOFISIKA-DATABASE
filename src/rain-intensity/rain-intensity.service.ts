import * as dotenv from 'dotenv';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

import { ActivityLogService } from '@/activity-log/activity-log.service';
import { EditRainIntensityDto } from '@/rain-intensity/dto/edit-rain-intensity.dto';
import { CreateRainIntensityDto } from '@/rain-intensity/dto/create-rain-intensity.dto';

dotenv.config();

@Injectable()
export class RainIntensityService {
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
   * Menyimpan data intensitas hujan dan mencatat ke activity log
   */
  async saveRainIntensity(
    dto: CreateRainIntensityDto,
    ipAddress: string,
    userAgent: string,
  ) {
    const { user_id, date, name } = dto;

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

    // 2. Simpan data intensitas hujan
    const { data: insertedRainIntensity, error: rainIntensityError } =
      await this.supabase
        .from('rain_intensity')
        .insert({ date, name })
        .select();

    if (rainIntensityError || !insertedRainIntensity) {
      return {
        success: false,
        message: 'Gagal menyimpan data intensitas hujan',
        error: rainIntensityError,
      };
    }

    // 3. Mencatat ke activity log
    const createdAt = new Date().toLocaleString('en-US', {
      timeZone: 'Asia/Jakarta',
    });

    await this.activityLogService.logActivity({
      admin_id: user_id,
      action: 'Menambahkan data intensitas hujan',
      description: `${namaAdmin} menambahkan data intensitas hujan dengan nama ${name} untuk tanggal ${date}.`,
      ip_address: ipAddress,
      user_agent: userAgent,
      created_at: createdAt,
    });

    return {
      success: true,
      message: 'Berhasil menyimpan data intensitas hujan',
      data: insertedRainIntensity,
    };
  }

  /**
   * Mengubah data temperatur minimal dan mencatat ke activity log
   */
  async updateRainIntensity(
    dto: EditRainIntensityDto,
    ipAddress: string,
    userAgent: string,
  ) {
    const { id, user_id, date, name } = dto;

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

    // 2. Update data intensitas hujan berdasarkan id
    const { data: updatedRainIntensity, error: rainIntensityError } =
      await this.supabase
        .from('rain_intensity')
        .update({ name, date })
        .eq('id', id)
        .select();

    if (rainIntensityError || !updatedRainIntensity) {
      return {
        success: false,
        message: 'Gagal mengubah data intensitas hujan',
        error: rainIntensityError,
      };
    }

    // 3. Mencatat ke activity log
    const createdAt = new Date().toLocaleString('en-US', {
      timeZone: 'Asia/Jakarta',
    });

    await this.activityLogService.logActivity({
      admin_id: user_id,
      action: 'Mengubah Data Intensitas Hujan',
      description: `${namaAdmin} mengubah data intensitas hujan dengan nama ${name} untuk tanggal ${date}.`,
      ip_address: ipAddress,
      user_agent: userAgent,
      created_at: createdAt,
    });

    return {
      success: true,
      message: 'Berhasil mengubah data intensitas hujan',
      data: updatedRainIntensity,
    };
  }

  /**
   * Menghapus data intensitas hujan dan mencatat ke activity log
   */
  async deleteRainIntensity(
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

    // 2. Ambil data intensitas hujan (untuk log)
    const { data: rainIntensityData, error: rainIntensityError } =
      await this.supabase
        .from('rain_intensity')
        .select(`*`)
        .eq('id', id)
        .single();

    if (rainIntensityError || !rainIntensityData) {
      return {
        success: false,
        message: 'Data intensitas hujan tidak ditemukan',
        error: rainIntensityError,
      };
    }

    const { name, date } = rainIntensityData;

    // 3. Hapus data intensitas hujan berdasarkan id
    const { error: deleteRainIntensityError } = await this.supabase
      .from('rain_intensity')
      .delete()
      .eq('id', id);

    if (deleteRainIntensityError) {
      return {
        success: false,
        message: 'Gagal menghapus data intensitas hujan',
        error: deleteRainIntensityError,
      };
    }

    // 4. Mencatat ke activity log
    const createdAt = new Date().toLocaleString('en-US', {
      timeZone: 'Asia/Jakarta',
    });

    await this.activityLogService.logActivity({
      admin_id: user_id,
      action: 'Menghapus Data Intensitas Hujan',
      description: `${namaAdmin} menghapus data intensitas hujan dengan nama ${name} untuk tanggal ${date}.`,
      ip_address: ipAddress,
      user_agent: userAgent,
      created_at: createdAt,
    });

    return {
      success: true,
      message: 'Berhasil menghapus data intensitas hujan',
      data: rainIntensityData,
    };
  }

  /**
   * Mengambil semua data intensitas hujan
   */
  async getAllRainIntensity() {
    const { data, error } = await this.supabase
      .from('rain_intensity')
      .select('*');

    if (error || !data) {
      return {
        success: false,
        message: 'Gagal mengambil data intensitas hujan',
        error,
      };
    }

    return {
      success: true,
      message: 'Berhasil mengambil semua data intensitas hujan',
      data: data,
    };
  }

  /**
   * Mengambil semua data intensitas hujan berdasarkan id
   */
  async getRainIntensityById(id: number) {
    const { data, error } = await this.supabase
      .from('rain_intensity')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return {
        success: false,
        message: 'Gagal mengambil data intensitas hujan berdasarkan id',
        error,
      };
    }

    return {
      success: true,
      message: 'Berhasil mengambil data intensitas hujan berdasarkan id',
      data,
    };
  }
}
