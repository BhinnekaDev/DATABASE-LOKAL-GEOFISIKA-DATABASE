import * as dotenv from 'dotenv';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

import { ActivityLogService } from '@/activity-log/activity-log.service';
import { EditAirPressureDto } from '@/air-pressure/dto/edit-air-pressure.dto';
import { CreateAirPressureDto } from '@/air-pressure/dto/create-air-pressure.dto';

dotenv.config();

@Injectable()
export class AirPressureService {
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
   * Menyimpan data tekanan udara dan mencatat ke activity log
   */
  async saveAirPressure(
    dto: CreateAirPressureDto,
    ipAddress: string,
    userAgent: string,
  ) {
    const {
      user_id,
      air_pressure,
      air_pressure_07,
      air_pressure_13,
      air_pressure_18,
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

    // 2. Simpan data tekanan udara
    const { data: insertedAirPressure, error: airPressureError } =
      await this.supabase
        .from('air_pressure')
        .insert({
          air_pressure,
          air_pressure_07,
          air_pressure_13,
          air_pressure_18,
        })
        .select()
        .single();

    if (airPressureError || !insertedAirPressure) {
      return {
        success: false,
        message: 'Gagal menyimpan data tekanan udara',
        error: airPressureError,
      };
    }

    // 3. Mencatat ke activity log
    const createdAt = new Date().toLocaleString('en-US', {
      timeZone: 'Asia/Jakarta',
    });

    await this.activityLogService.logActivity({
      admin_id: user_id,
      action: 'Menambahkan Data Tekanan Udara',
      description: `${namaAdmin} menambahkan data tekanan udara sebesar ${air_pressure}, dengan rincian: 07.00 = ${air_pressure_07}, 13.00 = ${air_pressure_13}, 18.00 = ${air_pressure_18}.`,
      ip_address: ipAddress,
      user_agent: userAgent,
      created_at: createdAt,
    });

    return {
      success: true,
      message: 'Berhasil menyimpan data tekanan udara',
      data: insertedAirPressure,
    };
  }

  /**
   * Mengubah data tekanan udara dan mencatat ke activity log
   */
  async updateAirPressure(
    dto: EditAirPressureDto,
    ipAddress: string,
    userAgent: string,
  ) {
    const {
      id,
      user_id,
      air_pressure,
      air_pressure_07,
      air_pressure_13,
      air_pressure_18,
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

    // 2. Update data tekanan udara berdasarkan id
    const { data: updatedAirPressure, error: airPressureError } =
      await this.supabase
        .from('air_pressure')
        .update({
          air_pressure,
          air_pressure_07,
          air_pressure_13,
          air_pressure_18,
        })
        .eq('id', id)
        .select()
        .single();

    if (airPressureError || !updatedAirPressure) {
      return {
        success: false,
        message: 'Gagal memperbarui data tekanan udara',
        error: airPressureError,
      };
    }

    // 3. Catat ke activity log
    const updatedAt = new Date().toLocaleString('en-US', {
      timeZone: 'Asia/Jakarta',
    });

    await this.activityLogService.logActivity({
      admin_id: user_id,
      action: 'Mengubah Data Tekanan Udara',
      description: `${namaAdmin} mengubah data tekanan udara sebesar ${air_pressure}, dengan rincian: 07.00 = ${air_pressure_07}, 13.00 = ${air_pressure_13}, 18.00 = ${air_pressure_18}.`,
      ip_address: ipAddress,
      user_agent: userAgent,
      created_at: updatedAt,
    });

    return {
      success: true,
      message: 'Berhasil memperbarui data tekanan udara',
      data: updatedAirPressure,
    };
  }

  /**
   * Menghapus data tekanan udara dan mencatat ke activity log
   */
  async deleteAirPressure(
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

    // 2. Ambil data tekanan udara (untuk log)
    const { data: airPressureData, error: getAirPressureError } =
      await this.supabase
        .from('air_pressure')
        .select('*')
        .eq('id', id)
        .single();

    if (getAirPressureError || !airPressureData) {
      return {
        success: false,
        message: 'Gagal mengambil data kelembapan',
        error: getAirPressureError,
      };
    }

    const { air_pressure, air_pressure_07, air_pressure_13, air_pressure_18 } =
      airPressureData;

    // 3. Hapus data tekanan udara
    const { error: humidityError } = await this.supabase
      .from('air_pressure')
      .delete()
      .eq('id', id)
      .select();

    if (humidityError) {
      return {
        success: false,
        message: 'Gagal menghapus data tekanan udara',
        error: humidityError,
      };
    }

    // 4. Catat ke activity log
    const deletedAt = new Date().toLocaleString('en-US', {
      timeZone: 'Asia/Jakarta',
    });

    await this.activityLogService.logActivity({
      admin_id: user_id,
      action: 'Menghapus Data Tekanan Udara',
      description: `${namaAdmin} menghapus data tekanan udara sebesar ${air_pressure}, dengan rincian: 07.00 = ${air_pressure_07}, 13.00 = ${air_pressure_13}, 18.00 = ${air_pressure_18}.`,
      ip_address: ipAddress,
      user_agent: userAgent,
      created_at: deletedAt,
    });

    return {
      success: true,
      message: 'Berhasil menghapus data tekanan udara',
      data: airPressureData,
    };
  }

  /**
   * Mengambil semua data tekanan udara
   */
  async getAllAirPressure() {
    const { data, error } = await this.supabase
      .from('air_pressure')
      .select(`*`);

    if (error || !data) {
      return {
        success: false,
        message: 'Gagal mengambil data tekanan udara',
        error,
      };
    }

    return {
      success: true,
      message: 'Berhasil mengambil semua data tekanan udara',
      data: data,
    };
  }

  /**
   * Mengambil semua data tekanan udara berdasarkan id
   */
  async getAirPressureById(id: number) {
    const { data, error } = await this.supabase
      .from('air_pressure')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return {
        success: false,
        message: 'Gagal mengambil data tekanan udara berdasarkan id',
        error,
      };
    }

    return {
      success: true,
      message: 'Berhasil mengambil data tekanan udara berdasarkan id',
      data,
    };
  }
}
