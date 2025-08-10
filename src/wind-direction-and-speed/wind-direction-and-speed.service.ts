import { Buffer } from 'buffer';
import * as dotenv from 'dotenv';
import * as ExcelJS from 'exceljs';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

import { ActivityLogService } from '@/activity-log/activity-log.service';
import { EditWindDirectionAndSpeedDto } from '@/wind-direction-and-speed/dto/edit-wind-direction-and-speed.dto';
import { GetWindDirectionAndSpeedQueryDto } from '@/wind-direction-and-speed/dto/getWindDirectionAndSpeedQueryDto';
import { CreateWindDirectionAndSpeedDto } from '@/wind-direction-and-speed/dto/create-wind-direction-and-speed.dto';
import { WindDirectionAndSpeedDataExcel } from '@/wind-direction-and-speed/interfaces/windDirectionAndSpeedDataExcel';
import { FilterWindDirectionAndSpeedByDateDto } from '@/wind-direction-and-speed/dto/filterWindDirectionAndSpeedByDateDto';
import { CreateWindDirectionAndSpeedExcelDto } from '@/wind-direction-and-speed/dto/create-wind-direction-and-speed-excel.dto';

dotenv.config();

@Injectable()
export class WindDirectionAndSpeedService {
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
   * Menyimpan data arah dan kecepatan angin  dan mencatat ke activity log
   */
  async saveWindDirectionAndSpeed(
    dto: CreateWindDirectionAndSpeedDto,
    ipAddress: string,
    userAgent: string,
  ) {
    const {
      user_id,
      date,
      speed,
      most_frequent_direction,
      max_speed,
      direction,
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

    // 2. Simpan data arah dan kecepatan angin ke tabel wind_direction_and_speed
    const { data: insertedWind, error: windError } = await this.supabase
      .from('wind_direction_and_speed')
      .insert({
        date,
        speed,
        most_frequent_direction,
        max_speed,
        direction,
      })
      .select()
      .single();

    if (windError || !insertedWind) {
      return {
        success: false,
        message: 'Gagal menyimpan data arah dan kecepatan angin',
        error: windError,
      };
    }

    // 3. Mencatat ke activity log
    const createdAt = new Date().toLocaleString('en-US', {
      timeZone: 'Asia/Jakarta',
    });

    await this.activityLogService.logActivity({
      admin_id: user_id,
      action: 'Menambahkan Data Arah dan Kecepatan Angin',
      description: `${namaAdmin} menambahkan data arah angin ${direction} dengan kecepatan rata-rata ${speed} dan kecepatan maksimum ${max_speed} pada tanggal ${date}.`,
      ip_address: ipAddress,
      user_agent: userAgent,
      created_at: createdAt,
    });

    return {
      success: true,
      message: 'Berhasil menyimpan data arah dan kecepatan angin',
      data: insertedWind,
    };
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
  ): WindDirectionAndSpeedDataExcel[] {
    const worksheet = workbook.worksheets[0];
    const data: WindDirectionAndSpeedDataExcel[] = [];

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;

      const kecepatan = row.getCell(1).value;
      const kecepatan_terbesar = row.getCell(2).value;
      const arah = row.getCell(3).value?.toString();
      const arah_terbanyak = row.getCell(4).value?.toString();
      const tanggal = row.getCell(5).value;

      data.push({
        tanggal: tanggal?.toString() ?? null,
        kecepatan:
          typeof kecepatan === 'number'
            ? kecepatan
            : parseFloat(kecepatan as string) || null,
        'kecepatan terbesar':
          typeof kecepatan_terbesar === 'number'
            ? kecepatan_terbesar
            : parseFloat(kecepatan_terbesar as string) || null,
        arah: arah ?? null,
        'arah terbanyak': arah_terbanyak ?? null,
      });
    });

    return data;
  }

  /**
   * Menyimpan data excel arah dan kecepatan angin dan mencatat ke activity log
   */
  async saveExcelWindDirectionAndSpeed(
    dto: CreateWindDirectionAndSpeedExcelDto,
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
        if (row['tanggal']?.toString().toLowerCase() === 'tanggal') {
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

        return {
          date: formattedDate,
          speed: row['kecepatan'] ?? null,
          max_speed: row['kecepatan terbesar'] ?? null,
          direction: row['arah'] ?? null,
          most_frequent_direction: row['arah terbanyak'] ?? null,
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

    // 5. Simpan data arah dan kecepatan angin ke dalam tabel 'wind_direction_and_speed'
    const {
      data: insertedwindDirectionAndSpeed,
      error: windDirectionAndSpeedError,
    } = await this.supabase
      .from('wind_direction_and_speed')
      .insert(dataWithFormattedDate)
      .select();

    if (
      windDirectionAndSpeedError ||
      !insertedwindDirectionAndSpeed ||
      insertedwindDirectionAndSpeed.length === 0
    ) {
      return {
        success: false,
        message: 'Gagal menyimpan data arah dan kecepatan angin',
        error: windDirectionAndSpeedError,
      };
    }

    // 6. Mencatat ke activity log
    const createdAt = new Date().toLocaleString('en-US', {
      timeZone: 'Asia/Jakarta',
    });

    await this.activityLogService.logActivity({
      admin_id: user_id,
      action: 'Menambahkan Data Arah dan Kecepatan Angin',
      description: `${namaAdmin} menambahkan data arah dan kecepatan angin dengan mengunggah file excel.`,
      ip_address: ipAddress,
      user_agent: userAgent,
      created_at: createdAt,
    });

    return {
      success: true,
      message: 'Berhasil menyimpan data arah dan kecepatan angin',
      data: insertedwindDirectionAndSpeed,
    };
  }

  /**
   * Mengubah data arah dan kecepatan angin dan mencatat ke activity log
   */
  async updateWindDirectionAndSpeed(
    dto: EditWindDirectionAndSpeedDto,
    ipAddress: string,
    userAgent: string,
  ) {
    const {
      id,
      user_id,
      date,
      speed,
      most_frequent_direction,
      max_speed,
      direction,
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

    // 2. Update data arah dan kecepatan angin berdasarkan id
    const {
      data: updateWindDirectionAndSpeed,
      error: windDirectionAndSpeedError,
    } = await this.supabase
      .from('wind_direction_and_speed')
      .update({
        date,
        speed,
        most_frequent_direction,
        max_speed,
        direction,
      })
      .eq('id', id)
      .select()
      .single();

    if (windDirectionAndSpeedError || !updateWindDirectionAndSpeed) {
      return {
        success: false,
        message: 'Gagal memperbarui data arah dan kecepatan angin',
        error: windDirectionAndSpeedError,
      };
    }

    // 3. Catat ke activity log
    const updatedAt = new Date().toLocaleString('en-US', {
      timeZone: 'Asia/Jakarta',
    });

    await this.activityLogService.logActivity({
      admin_id: user_id,
      action: 'Mengubah Data Arah dan Kecepatan Angin',
      description: `${namaAdmin} mengubah data arah angin ${direction} dengan kecepatan rata-rata ${speed} dan kecepatan maksimum ${max_speed} pada tanggal ${date}.`,
      ip_address: ipAddress,
      user_agent: userAgent,
      created_at: updatedAt,
    });

    return {
      success: true,
      message: 'Berhasil memperbarui data arah dan kecepatan angin',
      data: updateWindDirectionAndSpeed,
    };
  }

  /**
   * Menghapus data arah dan kecepatan angin dan mencatat ke activity log
   */
  async deleteWindDirectionAndSpeed(
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

    // 2. Ambil data arah dan kecepatan angin (untuk log)
    const {
      data: windDirectionAndSpeedData,
      error: getWindDirectionAndSpeedError,
    } = await this.supabase
      .from('wind_direction_and_speed')
      .select('*')
      .eq('id', id)
      .single();

    if (getWindDirectionAndSpeedError || !windDirectionAndSpeedData) {
      return {
        success: false,
        message: 'Gagal mengambil data arah dan kecepatan angin',
        error: getWindDirectionAndSpeedError,
      };
    }

    const { date, speed, max_speed, direction } = windDirectionAndSpeedData;

    // 3. Hapus data arah dan kecepatan angin
    const { error: deleteWindDirectionAndSpeedError } = await this.supabase
      .from('wind_direction_and_speed')
      .delete()
      .eq('id', id);

    if (deleteWindDirectionAndSpeedError) {
      return {
        success: false,
        message: 'Gagal menghapus data arah dan kecepatan angin',
        error: deleteWindDirectionAndSpeedError,
      };
    }

    // 4. Catat ke activity log
    const deletedAt = new Date().toLocaleString('en-US', {
      timeZone: 'Asia/Jakarta',
    });

    await this.activityLogService.logActivity({
      admin_id: user_id,
      action: 'Menghapus Data Arah dan Kecepatan Angin',
      description: `${namaAdmin} menghapus data arah angin ${direction} dengan kecepatan rata-rata ${speed} dan kecepatan maksimum ${max_speed} pada tanggal ${date}.`,
      ip_address: ipAddress,
      user_agent: userAgent,
      created_at: deletedAt,
    });

    return {
      success: true,
      message: 'Berhasil menghapus data arah dan kecepatan angin',
      data: windDirectionAndSpeedData,
    };
  }

  /**
   * Mengambil semua data arah dan kecepatan angin
   */
  async getAllWindDirectionAndSpeed() {
    const { data, error } = await this.supabase
      .from('wind_direction_and_speed')
      .select(`*`);

    if (error || !data) {
      return {
        success: false,
        message: 'Gagal mengambil data arah dan kecepatan angin',
        error,
      };
    }

    return {
      success: true,
      message: 'Berhasil mengambil semua data arah dan kecepatan angin',
      data: data,
    };
  }

  /**
   * Mengambil semua data arah dan kecepatan angin berdasarkan id
   */
  async getWindDirectionAndSpeedById(id: number) {
    const { data, error } = await this.supabase
      .from('wind_direction_and_speed')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return {
        success: false,
        message: 'Gagal mengambil data arah dan kecepatan angin berdasarkan id',
        error,
      };
    }

    return {
      success: true,
      message:
        'Berhasil mengambil data arah dan kecepatan angin berdasarkan id',
      data,
    };
  }

  /**
   * Mengambil data arah dan kecepatan angin berdasarkan rentang tanggal arah dan kecepatan angin
   */
  async getWindDirectionAndSpeedByDate(
    dto: FilterWindDirectionAndSpeedByDateDto,
  ) {
    const { start_date, end_date } = dto;

    const { data, error } = await this.supabase
      .from('wind_direction_and_speed')
      .select('*')
      .gte('date', start_date)
      .lte('date', end_date);

    if (error || !data) {
      return {
        success: false,
        message:
          'Gagal mengambil data arah dan kecepatan angin berdasarkan rentang tanggal arah dan kecepatan angin',
        error,
      };
    }

    return {
      success: true,
      message:
        'Berhasil mengambil data arah dan kecepatan angin berdasarkan rentang tanngal arah dan kecepatan angin',
      data,
    };
  }
}
