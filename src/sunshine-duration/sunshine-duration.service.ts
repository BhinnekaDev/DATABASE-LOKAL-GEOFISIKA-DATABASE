import { Buffer } from 'buffer';
import * as dotenv from 'dotenv';
import * as ExcelJS from 'exceljs';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

import { ActivityLogService } from '@/activity-log/activity-log.service';
import { EditSunshineDurationDto } from '@/sunshine-duration/dto/edit-sunshine-duration.dto';
import { CreateSunshineDurationDto } from '@/sunshine-duration/dto/create-sunshine-duration.dto';
import { SunshineDurationDataExcel } from '@/sunshine-duration/interfaces/SunshineDurationDataExcel';
import { FilterSunShineDurationByDateDto } from '@/sunshine-duration/dto/filterSunShineDurationByDateDto';
import { CreateSunshineDurationExcelDto } from '@/sunshine-duration/dto/create-sunshine-duration-excel.dto';

dotenv.config();

@Injectable()
export class SunshineDurationService {
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
  ): SunshineDurationDataExcel[] {
    const worksheet = workbook.worksheets[0];
    return worksheet
      .getSheetValues()
      .slice(1)
      .filter((row) => row !== null && row !== undefined)
      .map((row) => ({
        'durasi matahari terbit': row[1],
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
   * Menyimpan data durasi matahari terbit dan mencatat ke activity log
   */
  async saveSunshineDuration(
    dto: CreateSunshineDurationDto,
    ipAddress: string,
    userAgent: string,
  ) {
    const { user_id, date, sunshine_duration } = dto;

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

    // 2. Simpan data hari hujan
    const { data: insertedSunshineDurationDays, error: sunshineDurationError } =
      await this.supabase
        .from('sunshine_duration')
        .insert({ date, sunshine_duration })
        .select();

    if (sunshineDurationError) {
      return {
        success: false,
        message: 'Gagal menyimpan data durasi matahari terbit',
        error: sunshineDurationError,
      };
    }

    // 3. Catat ke activity log
    const createdAt = new Date().toLocaleString('en-US', {
      timeZone: 'Asia/Jakarta',
    });

    await this.activityLogService.logActivity({
      admin_id: user_id,
      action: 'Menambahkan Data Durasi Matahari Terbit',
      description: `${namaAdmin} menambahkan data durasi matahari terbit dengan nilai ${sunshine_duration} untuk tanggal ${date}`,
      ip_address: ipAddress,
      user_agent: userAgent,
      created_at: createdAt,
    });

    return {
      success: true,
      message: 'Berhasil menyimpan data durasi matahari terbit',
      data: insertedSunshineDurationDays,
    };
  }

  /**
   * Menyimpan data excel durasi matahari terbit dan mencatat ke activity log
   */
  async saveExcelSunshineDuration(
    dto: CreateSunshineDurationExcelDto,
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
          row['durasi matahari terbit']?.toString().toLowerCase() ===
            'durasi matahari terbit'
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

        const sunShineDuration = row['durasi matahari terbit'];
        if (!sunShineDuration) {
          console.error('Data tidak valid untuk data:', row);
          return null;
        }

        return {
          sunshine_duration: sunShineDuration,
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

    // 5. Simpan data durasi matahari terbit ke dalam tabel 'sunshine_duration'
    const { data: insertedSunshineDuration, error: sunShineDurationError } =
      await this.supabase
        .from('sunshine_duration')
        .insert(dataWithFormattedDate)
        .select();

    if (
      sunShineDurationError ||
      !insertedSunshineDuration ||
      insertedSunshineDuration.length === 0
    ) {
      return {
        success: false,
        message: 'Gagal menyimpan data durasi matahari terbit',
        error: sunShineDurationError,
      };
    }

    // 6. Mencatat ke activity log
    const createdAt = new Date().toLocaleString('en-US', {
      timeZone: 'Asia/Jakarta',
    });

    await this.activityLogService.logActivity({
      admin_id: user_id,
      action: 'Menambahkan Data Durasi Matahari Terbit',
      description: `${namaAdmin} menambahkan data durasi matahari terbit dengan mengunggah file excel.`,
      ip_address: ipAddress,
      user_agent: userAgent,
      created_at: createdAt,
    });

    return {
      success: true,
      message: 'Berhasil menyimpan data durasi matahari terbit',
      data: insertedSunshineDuration,
    };
  }

  /**
   * Mengubah data durasi matahari terbit dan mencatat ke activity log
   */
  async updateSunshineDuration(
    dto: EditSunshineDurationDto,
    ipAddress: string,
    userAgent: string,
  ) {
    const { id, user_id, date, sunshine_duration } = dto;

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

    // 2. Update data durasi matahari terbit berdasarkan id
    const { data: updatedSunshineDurationDays, error: sunshineDurationError } =
      await this.supabase
        .from('sunshine_duration')
        .update({ sunshine_duration, date })
        .eq('id', id)
        .select();

    if (sunshineDurationError) {
      return {
        success: false,
        message: 'Gagal mengubah data durasi matahari terbit',
        error: sunshineDurationError,
      };
    }

    // 3. Mencatat ke activity log
    const createdAt = new Date().toLocaleString('en-US', {
      timeZone: 'Asia/Jakarta',
    });

    await this.activityLogService.logActivity({
      admin_id: user_id,
      action: 'Mengubah Data Durasi Matahari Terbit',
      description: `${namaAdmin} mengubah data durasi matahari terbit dengan nilai ${sunshine_duration} untuk tanggal ${date}`,
      ip_address: ipAddress,
      user_agent: userAgent,
      created_at: createdAt,
    });

    return {
      success: true,
      message: 'Berhasil mengubah data durasi matahari terbit',
      data: updatedSunshineDurationDays,
    };
  }

  /**
   * Menghapus data durasi matahari terbit dan mencatat ke activity log
   */
  async deleteSunshineDuration(
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

    // 2. Ambil data durasi matahari terbit (untuk log)
    const { data: sunshineDurationData, error: getSunshineDurationError } =
      await this.supabase
        .from('sunshine_duration')
        .select('*')
        .eq('id', id)
        .single();

    if (getSunshineDurationError || !sunshineDurationData) {
      return {
        success: false,
        message: 'Data durasi matahari terbit tidak ditemukan',
        error: getSunshineDurationError,
      };
    }

    const { date, sunshine_duration } = sunshineDurationData;

    // 3. Hapus data durasi matahari terbit berdasarkan id
    const { error: sunshineDurationError } = await this.supabase
      .from('sunshine_duration')
      .delete()
      .eq('id', id);

    if (sunshineDurationError) {
      return {
        success: false,
        message: 'Gagal menghapus data durasi matahari terbit',
        error: sunshineDurationError,
      };
    }

    // 4. Mencatat ke activity log
    const createdAt = new Date().toLocaleString('en-US', {
      timeZone: 'Asia/Jakarta',
    });

    await this.activityLogService.logActivity({
      admin_id: user_id,
      action: 'Menghapus Data Durasi Matahari Terbit',
      description: `${namaAdmin} menghapus data durasi matahari terbit dengan nilai ${sunshine_duration} untuk tanggal ${date}`,
      ip_address: ipAddress,
      user_agent: userAgent,
      created_at: createdAt,
    });

    return {
      success: true,
      message: 'Berhasil menghapus data durasi matahari terbit',
      data: sunshineDurationData,
    };
  }

  /**
   * Mengambil semua data durasi matahari terbit
   */
  async getAllSunshineDuration() {
    const { data, error } = await this.supabase
      .from('sunshine_duration')
      .select('*');

    if (error || !data) {
      return {
        success: false,
        message: 'Gagal mengambil data durasi matahari terbit',
        error,
      };
    }

    return {
      success: true,
      message: 'Berhasil mengambil semua data durasi matahari terbit',
      data: data,
    };
  }

  /**
   * Mengambil semua data durasi matahari terbit berdasarkan id
   */
  async getSunshineDurationById(id: number) {
    const { data, error } = await this.supabase
      .from('sunshine_duration')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return {
        success: false,
        message: 'Gagal mengambil data durasi matahari terbit berdasarkan id',
        error,
      };
    }

    return {
      success: true,
      message: 'Berhasil mengambil data durasi matahari terbit berdasarkan id',
      data,
    };
  }

  /**
   * Mengambil data durasi matahari terbit berdasarkan rentang tanggal
   */
  async getSunshineDurationByDate(dto: FilterSunShineDurationByDateDto) {
    const { start_date, end_date } = dto;

    const { data, error } = await this.supabase
      .from('sunshine_duration')
      .select('*')
      .gte('date', start_date)
      .lte('date', end_date);

    if (error || !data) {
      return {
        success: false,
        message:
          'Gagal mengambil data durasi matahari terbit berdasarkan rentang tanggal',
        error,
      };
    }

    return {
      success: true,
      message:
        'Berhasil mengambil data durasi matahari terbit berdasarkan rentang tanggal',
      data,
    };
  }
}
