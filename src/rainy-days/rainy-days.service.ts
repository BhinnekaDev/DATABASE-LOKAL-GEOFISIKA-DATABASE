import { Buffer } from 'buffer';
import * as dotenv from 'dotenv';
import * as ExcelJS from 'exceljs';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

import { EditRainyDaysDto } from '@/rainy-days/dto/edit-rainy-days.dto';
import { ActivityLogService } from '@/activity-log/activity-log.service';
import { CreateRainyDaysDto } from '@/rainy-days/dto/create-rainy-days.dto';
import { RainyDaysDataExcel } from '@/rainy-days/interfaces/rainyDaysDataExcel';
import { FilterRainyDaysByDateDto } from '@/rainy-days/dto/filterRainyDaysByDateDto';
import { CreateRainyDaysExcelDto } from '@/rainy-days/dto/create-rainy-days-excel.dto';

dotenv.config();

@Injectable()
export class RainyDaysService {
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
  private parseExcelToData(workbook: ExcelJS.Workbook): RainyDaysDataExcel[] {
    const worksheet = workbook.worksheets[0];
    return worksheet
      .getSheetValues()
      .slice(1)
      .filter((row) => row !== null && row !== undefined)
      .map((row) => ({
        'hari hujan': row[1],
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
   * Menyimpan data hari hujan dan mencatat ke activity log
   */
  async saveRainyDays(
    dto: CreateRainyDaysDto,
    ipAddress: string,
    userAgent: string,
  ) {
    const { user_id, date, rainy_day } = dto;

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
    const { data: insertedRainyDays, error: rainyDaysError } =
      await this.supabase
        .from('rainy_days')
        .insert({ date, rainy_day })
        .select();

    if (rainyDaysError) {
      return {
        success: false,
        message: 'Gagal menyimpan data hari hujan',
        error: rainyDaysError,
      };
    }

    // 3. Catat ke activity log
    const createdAt = new Date().toLocaleString('en-US', {
      timeZone: 'Asia/Jakarta',
    });

    await this.activityLogService.logActivity({
      admin_id: user_id,
      action: 'Menambahkan Data Hari Hujan',
      description: `${namaAdmin} menambahkan data hari hujan dengan nilai ${rainy_day} untuk tanggal ${date}`,
      ip_address: ipAddress,
      user_agent: userAgent,
      created_at: createdAt,
    });

    return {
      success: true,
      message: 'Berhasil menyimpan data hari hujan',
      data: insertedRainyDays,
    };
  }

  /**
   * Menyimpan data excel hari hujan dan mencatat ke activity log
   */
  async saveExcelRainyDays(
    dto: CreateRainyDaysExcelDto,
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
          row['hari hujan']?.toString().toLowerCase() === 'hari hujan'
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

        const rainyDays = row['hari hujan']?.toString().toLowerCase();

        return {
          rainy_day: rainyDays,
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

    // 5. Simpan data hari hujan ke dalam tabel 'rainyDays'
    const { data: insertedrainyDays, error: rainyDaysError } =
      await this.supabase
        .from('rainy_days')
        .insert(dataWithFormattedDate)
        .select();

    if (
      rainyDaysError ||
      !insertedrainyDays ||
      insertedrainyDays.length === 0
    ) {
      return {
        success: false,
        message: 'Gagal menyimpan data hari hujan',
        error: rainyDaysError,
      };
    }

    // 6. Mencatat ke activity log
    const createdAt = new Date().toLocaleString('en-US', {
      timeZone: 'Asia/Jakarta',
    });

    await this.activityLogService.logActivity({
      admin_id: user_id,
      action: 'Menambahkan Data Hari Hujan',
      description: `${namaAdmin} menambahkan data hari hujan dengan mengunggah file excel.`,
      ip_address: ipAddress,
      user_agent: userAgent,
      created_at: createdAt,
    });

    return {
      success: true,
      message: 'Berhasil menyimpan data hari hujan',
      data: insertedrainyDays,
    };
  }

  /**
   * Mengubah data hari hujan dan mencatat ke activity log
   */
  async updateRainyDays(
    dto: EditRainyDaysDto,
    ipAddress: string,
    userAgent: string,
  ) {
    const { id, user_id, date, rainy_day } = dto;

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

    // 2. Update data hari hujan berdasarkan id
    const { data: updatedRainyDays, error: rainyDaysError } =
      await this.supabase
        .from('rainy_days')
        .update({ rainy_day, date })
        .eq('id', id)
        .select();

    if (rainyDaysError) {
      return {
        success: false,
        message: 'Gagal mengubah data hari hujan',
        error: rainyDaysError,
      };
    }

    // 3. Catat ke activity log
    const createdAt = new Date().toLocaleString('en-US', {
      timeZone: 'Asia/Jakarta',
    });

    await this.activityLogService.logActivity({
      admin_id: user_id,
      action: 'Mengubah Data Hari Hujan',
      description: `${namaAdmin} mengubah data hari hujan dengan nilai ${rainy_day} untuk tanggal ${date}`,
      ip_address: ipAddress,
      user_agent: userAgent,
      created_at: createdAt,
    });

    return {
      success: true,
      message: 'Berhasil memperbarui data hari hujan',
      data: updatedRainyDays,
    };
  }

  /**
   * Menghapus data hari hujan dan mencatat ke activity log
   */
  async deleteRainyDays(
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

    // 2. Ambil data hari hujan (untuk log)
    const { data: rainyDaysData, error: getRainyDaysError } =
      await this.supabase.from('rainy_days').select('*').eq('id', id).single();

    if (getRainyDaysError) {
      return {
        success: false,
        message: 'Gagal mengambil data hari hujan',
        error: getRainyDaysError,
      };
    }

    const { rainy_day, date } = rainyDaysData;

    // 3. Hapus data hari hujan berdasarkan id
    const { error: rainyDaysError } = await this.supabase
      .from('rainy_days')
      .delete()
      .eq('id', id);

    if (rainyDaysError) {
      return {
        success: false,
        message: 'Gagal menghapus data hari hujan',
        error: rainyDaysError,
      };
    }

    // 4. Catat ke activity log
    const createdAt = new Date().toLocaleString('en-US', {
      timeZone: 'Asia/Jakarta',
    });

    await this.activityLogService.logActivity({
      admin_id: user_id,
      action: 'Menghapus Data Hari Hujan',
      description: `${namaAdmin} menghapus data hari hujan dengan nilai ${rainy_day} untuk tanggal ${date}`,
      ip_address: ipAddress,
      user_agent: userAgent,
      created_at: createdAt,
    });

    return {
      success: true,
      message: 'Berhasil menghapus data hari hujan',
      data: rainyDaysData,
    };
  }

  /**
   * Mengambil semua data hari hujan
   */
  async getAllRainyDays() {
    const { data, error } = await this.supabase.from('rainy_days').select('*');

    if (error || !data) {
      return {
        success: false,
        message: 'Gagal mengambil semua data hari hujan',
        error,
      };
    }

    return {
      success: true,
      message: 'Berhasil mengambil semua data hari hujan',
      data: data,
    };
  }

  /**
   * Mengambil semua data temperatur minimal berdasarkan id
   */
  async getRainyDaysById(id: number) {
    const { data, error } = await this.supabase
      .from('rainy_days')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return {
        success: false,
        message: 'Gagal mengambil data hari hujan berdasarkan id',
        error,
      };
    }

    return {
      success: true,
      message: 'Berhasil mengambil data hari hujan berdasarkan id',
      data,
    };
  }

  /**
   * Mengambil data hari hujan berdasarkan rentang tanggal
   */
  async getRainyDaysByDate(dto: FilterRainyDaysByDateDto) {
    const { start_date, end_date } = dto;

    const { data, error } = await this.supabase
      .from('rainy_days')
      .select('*')
      .gte('date', start_date)
      .lte('date', end_date);

    if (error || !data) {
      return {
        success: false,
        message: 'Gagal mengambil data hari hujan berdasarkan rentang tanggal',
        error,
      };
    }

    return {
      success: true,
      message: 'Berhasil mengambil data hari hujan berdasarkan rentang tanggal',
      data,
    };
  }
}
