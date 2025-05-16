import { Buffer } from 'buffer';
import * as dotenv from 'dotenv';
import * as ExcelJS from 'exceljs';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

import { ActivityLogService } from '@/activity-log/activity-log.service';
import { EditMaxTemperatureDto } from '@/max-temperature/dto/edit-max-temperature.dto';
import { CreateMaxTemperatureDto } from '@/max-temperature/dto/create-max-temperature.dto';
import { MaxTemperatureDataExcel } from '@/max-temperature/interfaces/MaxTemperatureDataExcel';
import { FilterMaxTemperatureByDateDto } from '@/max-temperature/dto/filterMaxTemperatureByDateDto';
import { CreateMaxTemperatureExcelDto } from '@/max-temperature/dto/create-max-temperature-excel.dto';

dotenv.config();

@Injectable()
export class MaxTemperatureService {
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
   * Mendecode base64 menjadi objek Excel
   */
  private async decodeBase64ToExcel(
    base64: string,
  ): Promise<ExcelJS.Workbook | null> {
    try {
      const buffer = Buffer.from(base64, 'base64');
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer);
      return workbook;
    } catch (error) {
      console.error('Error decoding base64 to Excel:', error);
      return null;
    }
  }

  /**
   * Mengonversi data excel menjadi array objek
   */
  private parseExcelToData(
    workbook: ExcelJS.Workbook,
  ): MaxTemperatureDataExcel[] {
    const worksheet = workbook.worksheets[0];
    return worksheet
      .getSheetValues()
      .slice(1)
      .filter((row) => row !== null && row !== undefined)
      .map((row) => ({
        'temperatur maksimal': row[1],
        tanggal: row[2],
      }));
  }

  /**
   * Mengonversi tanggal dari berbagai format menjadi format YYYY-MM-DD
   */
  private formatDateToPostgres(date: string): string | null {
    // Validasi dan konversi format tanggal
    const parsedDate = new Date(date);
    if (!isNaN(parsedDate.getTime())) {
      return parsedDate.toISOString().split('T')[0];
    }

    // Format tanggal MM/DD/YYYY
    const [month, day, year] = date.split('/');
    if (month && day && year && year.length === 4) {
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }

    // Format tanggal 1.1 (DD.MM)
    const [day2, month2] = date.split('.');
    if (day2 && month2) {
      const currentYear = new Date().getFullYear();
      return `${currentYear}-${month2.padStart(2, '0')}-${day2.padStart(2, '0')}`;
    }

    return null;
  }

  /**
   * Menyimpan data temperatur maksimal dan mencatat ke activity log
   */
  async saveMaxTemperature(
    dto: CreateMaxTemperatureDto,
    ipAddress: string,
    userAgent: string,
  ) {
    const { user_id, date, max_temperature } = dto;

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

    // 2. Simpan data max temperatur
    const { data: insertedMaxTemperature, error: maxTemperatureError } =
      await this.supabase
        .from('max_temperature')
        .insert({
          date,
          max_temperature,
        })
        .select()
        .single();

    if (maxTemperatureError) {
      return {
        success: false,
        message: 'Gagal menyimpan data temperatur maksimal',
        error: maxTemperatureError,
      };
    }

    // 3. Mencatat ke activity log
    const createdAt = new Date().toLocaleString('en-US', {
      timeZone: 'Asia/Jakarta',
    });

    await this.activityLogService.logActivity({
      admin_id: user_id,
      action: 'Menambahkan Data Temperatur Maksimal',
      description: `${namaAdmin} menambahkan data temperatur maksimal dengan nilai ${max_temperature} untuk tanggal ${date}`,
      ip_address: ipAddress,
      user_agent: userAgent,
      created_at: createdAt,
    });

    return {
      success: true,
      message: 'Berhasil menyimpan data temperatur maksimal',
      data: insertedMaxTemperature,
    };
  }

  /**
   * Menyimpan data excel temperatur maksimal dan mencatat ke activity log
   */
  async saveExcelMaxTemperature(
    dto: CreateMaxTemperatureExcelDto,
    ipAddress: string,
    userAgent: string,
  ) {
    const { user_id, file_base64 } = dto;

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

    // 2. Decode base64 ke file Excel
    const workbook = await this.decodeBase64ToExcel(file_base64);
    if (!workbook) {
      return {
        success: false,
        message: 'Gagal mendecode base64 menjadi file Excel',
      };
    }

    // 3. Parse Excel menjadi objek
    const data = this.parseExcelToData(workbook);
    if (data.length === 0) {
      return {
        success: false,
        message: 'Data Excel kosong atau tidak valid',
      };
    }

    // 4. Format tanggal dan sesuaikan data untuk tabel
    const dataWithFormattedDate = data
      .map((row) => {
        if (
          row['tanggal']?.toString().toLowerCase() === 'tanggal' ||
          row['temperatur maksimal']?.toString().toLowerCase() ===
            'temperatur maksimal'
        ) {
          return null;
        }

        if (!row['tanggal']) {
          console.error('Tanggal tidak ditemukan untuk data:', row);
          return null;
        }

        const formattedDate = this.formatDateToPostgres(row['tanggal']);
        if (!formattedDate) {
          console.error('Tanggal tidak valid:', row['tanggal']);
          return null;
        }

        const maxTemperatur = row['temperatur maksimal'];
        if (!maxTemperatur) {
          console.error('Data tidak valid untuk data:', row);
          return null;
        }

        return {
          max_temperature: maxTemperatur,
          date: formattedDate,
        };
      })
      .filter((row) => row !== null);

    // Pastikan ada data yang valid sebelum dilanjutkan
    if (dataWithFormattedDate.length === 0) {
      return {
        success: false,
        message: 'Tidak ada data valid untuk disimpan',
      };
    }

    // 5. Simpan data temperatur maksimal ke dalam tabel 'max_temperature'
    const { data: insertedMaxTemperature, error: maxTemperatureError } =
      await this.supabase
        .from('max_temperature')
        .insert(dataWithFormattedDate)
        .select();

    if (
      maxTemperatureError ||
      !insertedMaxTemperature ||
      insertedMaxTemperature.length === 0
    ) {
      return {
        success: false,
        message: 'Gagal menyimpan data temperatur maksimal',
        error: maxTemperatureError,
      };
    }

    // 6. Mencatat ke activity log
    const createdAt = new Date().toLocaleString('en-US', {
      timeZone: 'Asia/Jakarta',
    });

    await this.activityLogService.logActivity({
      admin_id: user_id,
      action: 'Menambahkan Data Temperatur Maksimal',
      description: `${namaAdmin} menambahkan data temperatur maksimal dengan mengunggah file excel.`,
      ip_address: ipAddress,
      user_agent: userAgent,
      created_at: createdAt,
    });

    return {
      success: true,
      message: 'Berhasil menyimpan data temperatur maksimal',
      data: insertedMaxTemperature,
    };
  }

  /**
   * Mengubah data temperatur maksimal dan mencatat ke activity log
   */
  async updateMaxTemperature(
    dto: EditMaxTemperatureDto,
    ipAddress: string,
    userAgent: string,
  ) {
    const { id, user_id, date, max_temperature } = dto;

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

    // 2. Simpan data max temperatur
    const { data: updatedMaxTemperature, error: maxTemperatureError } =
      await this.supabase
        .from('max_temperature')
        .update({ max_temperature, date })
        .eq('id', id)
        .select()
        .single();

    if (maxTemperatureError) {
      return {
        success: false,
        message: 'Gagal menyimpan data temperatur maksimal',
        error: maxTemperatureError,
      };
    }

    // 3. Mencatat ke activity log
    const createdAt = new Date().toLocaleString('en-US', {
      timeZone: 'Asia/Jakarta',
    });

    await this.activityLogService.logActivity({
      admin_id: user_id,
      action: 'Mengubah Data Temperatur Maksimal',
      description: `${namaAdmin} mengubah data temperatur maksimal dengan nilai ${max_temperature} untuk tanggal ${date}`,
      ip_address: ipAddress,
      user_agent: userAgent,
      created_at: createdAt,
    });

    return {
      success: true,
      message: 'Berhasil memperbaharui data temperatur maksimal',
      data: updatedMaxTemperature,
    };
  }

  /**
   * Menghapus data temperatur maksimal dan mencatat ke activity log
   */
  async deleteMaxTemperature(
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

    // 2. Ambil data temperatur maksimal (untuk log)
    const { data: maxTemperatureData, error: getMaxTemperatureError } =
      await this.supabase
        .from('max_temperature')
        .select('*')
        .eq('id', id)
        .single();

    if (getMaxTemperatureError) {
      return {
        success: false,
        message: 'Gagal mengambil data temperatur maksimal',
        error: getMaxTemperatureError,
      };
    }

    const { max_temperature, date } = maxTemperatureData;

    // 3. Hapus data max temperatur berdasarkan id
    const { error: maxTemperatureError } = await this.supabase
      .from('max_temperature')
      .delete()
      .eq('id', id)
      .select()
      .single();

    if (maxTemperatureError) {
      return {
        success: false,
        message: 'Gagal menghapus data temperatur maksimal',
        error: maxTemperatureError,
      };
    }

    // 4. Mencatat ke activity log
    const createdAt = new Date().toLocaleString('en-US', {
      timeZone: 'Asia/Jakarta',
    });

    await this.activityLogService.logActivity({
      admin_id: user_id,
      action: 'Menghapus Data Temperatur Maksimal',
      description: `${namaAdmin} menghapus data temperatur maksimal dengan nilai ${max_temperature} untuk tanggal ${date}`,
      ip_address: ipAddress,
      user_agent: userAgent,
      created_at: createdAt,
    });

    return {
      success: true,
      message: 'Berhasil menghapus data temperatur maksimal',
      data: maxTemperatureData,
    };
  }

  /**
   * Mengambil semua data temperatur maksimal
   */
  async getAllMaxTemperature() {
    const { data, error } = await this.supabase
      .from('max_temperature')
      .select('*');

    if (error || !data) {
      return {
        success: false,
        message: 'Gagal mengambil data temperatur maksimal',
        error,
      };
    }

    return {
      success: true,
      message: 'Berhasil mengambil semua data temperatur maksimal',
      data: data,
    };
  }

  /**
   * Mengambil semua data temperatur maksimal berdasarkan id
   */
  async getMaxTemperatureById(id: number) {
    const { data, error } = await this.supabase
      .from('max_temperature')
      .select(`*`)
      .eq('id', id)
      .single();

    if (error || !data) {
      return {
        success: false,
        message: 'Gagal mengambil data temperatur maksimal berdasarkan id',
        error,
      };
    }

    return {
      success: true,
      message: 'Berhasil mengambil data temperatur maksimal berdasarkan id',
      data,
    };
  }

  /**
   * Mengambil data temperatur maksimal berdasarkan rentang tanggal
   */
  async getMaxTemperatureByDate(dto: FilterMaxTemperatureByDateDto) {
    const { start_date, end_date } = dto;

    const { data, error } = await this.supabase
      .from('max_temperature')
      .select('*')
      .gte('date', start_date)
      .lte('date', end_date);

    if (error || !data) {
      return {
        success: false,
        message:
          'Gagal mengambil data temperatur maksimal berdasarkan rentang tanggal',
        error,
      };
    }

    return {
      success: true,
      message:
        'Berhasil mengambil data temperatur maksimal berdasarkan rentang tanggal',
      data,
    };
  }
}
