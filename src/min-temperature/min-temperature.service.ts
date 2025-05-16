import { Buffer } from 'buffer';
import * as dotenv from 'dotenv';
import * as ExcelJS from 'exceljs';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

import { ActivityLogService } from '@/activity-log/activity-log.service';
import { EditMinTemperatureDto } from '@/min-temperature/dto/edit-min-temperature.dto';
import { CreateMinTemperatureDto } from '@/min-temperature/dto/create-min-temperature.dto';
import { MinTemperatureDataExcel } from '@/min-temperature/interfaces/MinTemperatureDataExcel';
import { FilterMinTemperatureByDateDto } from '@/min-temperature/dto/filterMinTemperatureByDateDto';
import { CreateMinTemperatureExcelDto } from '@/min-temperature/dto/create-min-temperature-excel.dto';

dotenv.config();

@Injectable()
export class MinTemperatureService {
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
  ): MinTemperatureDataExcel[] {
    const worksheet = workbook.worksheets[0];
    return worksheet
      .getSheetValues()
      .slice(1)
      .filter((row) => row !== null && row !== undefined)
      .map((row) => ({
        'temperatur minimal': row[1],
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
   * Menyimpan data temperatur minimal dan mencatat ke activity log
   */
  async saveMinTemperature(
    dto: CreateMinTemperatureDto,
    ipAddress: string,
    userAgent: string,
  ) {
    const { user_id, date, min_temperature } = dto;

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

    // 2. Simpan data temperatur minimal
    const { data: insertedMinTemperature, error: minTemperatureError } =
      await this.supabase
        .from('min_temperature')
        .insert({ date, min_temperature })
        .select();

    if (minTemperatureError) {
      return {
        success: false,
        message: 'Gagal menyimpan data temperatur minimal',
        error: minTemperatureError,
      };
    }

    // 3. Mencatat ke activity log
    const createdAt = new Date().toLocaleString('en-US', {
      timeZone: 'Asia/Jakarta',
    });

    await this.activityLogService.logActivity({
      admin_id: user_id,
      action: 'Menambahkan Data Temperatur Minimal',
      description: `${namaAdmin} menambahkan data temperatur minimal dengan nilai ${min_temperature} untuk tanggal ${date}`,
      ip_address: ipAddress,
      user_agent: userAgent,
      created_at: createdAt,
    });

    return {
      success: true,
      message: 'Berhasil menyimpan data temperatur minimal',
      data: insertedMinTemperature,
    };
  }

  /**
   * Menyimpan data excel temperatur minimal dan mencatat ke activity log
   */
  async saveExcelMinTemperature(
    dto: CreateMinTemperatureExcelDto,
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
          row['temperatur minimal']?.toString().toLowerCase() ===
            'temperatur minimal'
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

        const minTemperatur = row['temperatur minimal'];
        if (!minTemperatur) {
          console.error('Data tidak valid untuk data:', row);
          return null;
        }

        return {
          min_temperature: minTemperatur,
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

    // 5. Simpan data temperatur minimal ke dalam tabel 'min_temperature'
    const { data: insertedMinTemperature, error: minTemperatureError } =
      await this.supabase
        .from('min_temperature')
        .insert(dataWithFormattedDate)
        .select();

    if (
      minTemperatureError ||
      !insertedMinTemperature ||
      insertedMinTemperature.length === 0
    ) {
      return {
        success: false,
        message: 'Gagal menyimpan data temperatur minimal',
        error: minTemperatureError,
      };
    }

    // 6. Mencatat ke activity log
    const createdAt = new Date().toLocaleString('en-US', {
      timeZone: 'Asia/Jakarta',
    });

    await this.activityLogService.logActivity({
      admin_id: user_id,
      action: 'Menambahkan Data Temperatur Minimal',
      description: `${namaAdmin} menambahkan data temperatur minimal dengan mengunggah file excel.`,
      ip_address: ipAddress,
      user_agent: userAgent,
      created_at: createdAt,
    });

    return {
      success: true,
      message: 'Berhasil menyimpan data temperatur minimal',
      data: insertedMinTemperature,
    };
  }

  /**
   * Mengubah data temperatur minimal dan mencatat ke activity log
   */
  async updateMinTemperature(
    dto: EditMinTemperatureDto,
    ipAddress: string,
    userAgent: string,
  ) {
    const { id, user_id, date, min_temperature } = dto;

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

    // 2. Update data temperatur minimal berdasarkan id
    const { data: updatedMinTemperature, error: minTemperatureError } =
      await this.supabase
        .from('min_temperature')
        .update({ min_temperature, date })
        .eq('id', id)
        .select();

    if (minTemperatureError) {
      return {
        success: false,
        message: 'Gagal mengubah data temperatur minimal',
        error: minTemperatureError,
      };
    }

    // 3. Mencatat ke activity log
    const createdAt = new Date().toLocaleString('en-US', {
      timeZone: 'Asia/Jakarta',
    });

    await this.activityLogService.logActivity({
      admin_id: user_id,
      action: 'Mengubah Data Temperatur Minimal',
      description: `${namaAdmin} mengubah data temperatur minimal dengan nilai ${min_temperature} untuk tanggal ${date}`,
      ip_address: ipAddress,
      user_agent: userAgent,
      created_at: createdAt,
    });

    return {
      success: true,
      message: 'Berhasil mengubah data temperatur minimal',
      data: updatedMinTemperature,
    };
  }

  /**
   * Menghapus data temperatur minimal dan mencatat ke activity log
   */
  async deleteMinTemperature(
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

    // 2. Ambil data temperatur minimal (untuk log)
    const { data: minTemperatureData, error: getMintemperatureError } =
      await this.supabase
        .from('min_temperature')
        .select('*')
        .eq('id', id)
        .single();

    if (getMintemperatureError) {
      return {
        success: false,
        message: 'Gagal mengambil data temperatur minimal',
        error: getMintemperatureError,
      };
    }

    const { min_temperature, date } = minTemperatureData;

    // 3. Hapus data temperatur minimal berdasarkan id
    const { error: minTemperatureError } = await this.supabase
      .from('min_temperature')
      .delete()
      .eq('id', id);

    if (minTemperatureError) {
      return {
        success: false,
        message: 'Gagal menghapus data temperatur minimal',
        error: minTemperatureError,
      };
    }

    // 4. Mencatat ke activity log
    const createdAt = new Date().toLocaleString('en-US', {
      timeZone: 'Asia/Jakarta',
    });

    await this.activityLogService.logActivity({
      admin_id: user_id,
      action: 'Menghapus Data Temperatur Minimal',
      description: `${namaAdmin} menghapus data temperatur minimal dengan nilai ${min_temperature} untuk tanggal ${date}`,
      ip_address: ipAddress,
      user_agent: userAgent,
      created_at: createdAt,
    });

    return {
      success: true,
      message: 'Berhasil menghapus data temperatur minimal',
      data: minTemperatureData,
    };
  }

  /**
   * Mengambil semua data temperatur minimal
   */
  async getAllMinTemperature() {
    const { data, error } = await this.supabase
      .from('min_temperature')
      .select('*');

    if (error || !data) {
      return {
        success: false,
        message: 'Gagal mengambil data temperatur minimal',
        error,
      };
    }

    return {
      success: true,
      message: 'Berhasil mengambil semua data temperatur minimal',
      data: data,
    };
  }

  /**
   * Mengambil semua data temperatur minimal berdasarkan id
   */
  async getMinTemperatureById(id: number) {
    const { data, error } = await this.supabase
      .from('min_temperature')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return {
        success: false,
        message: 'Gagal mengambil data temperatur minimal berdasarkan id',
        error,
      };
    }

    return {
      success: true,
      message: 'Berhasil mengambil data temperatur minimal berdasarkan id',
      data,
    };
  }

  /**
   * Mengambil data teratur minimal berdasarkan rentang tanggal
   */
  async getMinTemperatureByDate(dto: FilterMinTemperatureByDateDto) {
    const { start_date, end_date } = dto;

    const { data, error } = await this.supabase
      .from('min_temperature')
      .select('*')
      .gte('date', start_date)
      .lte('date', end_date);

    if (error || !data) {
      return {
        success: false,
        message:
          'Gagal mengambil data temperatur minimal berdasarkan rentang tanggal',
        error,
      };
    }

    return {
      success: true,
      message:
        'Berhasil mengambil data temperatur minimal berdasarkan rentang tanggal',
      data,
    };
  }
}
