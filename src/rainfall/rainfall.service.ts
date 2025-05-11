import { Buffer } from 'buffer';
import * as dotenv from 'dotenv';
import * as ExcelJS from 'exceljs';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

import { EditRainfallDto } from '@/rainfall/dto/edit-rainfall.dto';
import { CreateRainfallDto } from '@/rainfall/dto/create-rainfall.dto';
import { ActivityLogService } from '@/activity-log/activity-log.service';
import { RainfallDataExcel } from '@/rainfall/interfaces/RainfallDataExcel';
import { FilterRainfallByDateDto } from '@/rainfall/dto/filterRainfallByDateDto';
import { CreateRainfallExcelDto } from '@/rainfall/dto/create-rainfall-excel.dto';

dotenv.config();

@Injectable()
export class RainfallService {
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
  private parseExcelToData(workbook: ExcelJS.Workbook): RainfallDataExcel[] {
    const worksheet = workbook.worksheets[0];
    return worksheet
      .getSheetValues()
      .slice(1)
      .filter((row) => row !== null && row !== undefined)
      .map((row) => ({
        'curah hujan': row[1],
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
   * Menyimpan data curah hujan dan mencatat ke activity log
   */
  async saveRainfall(
    dto: CreateRainfallDto,
    ipAddress: string,
    userAgent: string,
  ) {
    const { user_id, date, rainfall } = dto;

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

    // 2. Simpan data curah hujan
    const { data: insertedRainfall, error: rainfallError } = await this.supabase
      .from('rainfall')
      .insert({ date, rainfall })
      .select();

    if (rainfallError || !insertedRainfall) {
      return {
        success: false,
        message: 'Gagal menyimpan data curah hujan',
        error: rainfallError,
      };
    }

    // 3. Mencatat ke activity log
    const createdAt = new Date().toLocaleString('en-US', {
      timeZone: 'Asia/Jakarta',
    });

    await this.activityLogService.logActivity({
      admin_id: user_id,
      action: 'Menambahkan Data Curah Hujan',
      description: `${namaAdmin} menambahkan data curah hujan dengan nilai ${rainfall} untuk tanggal ${date}`,
      ip_address: ipAddress,
      user_agent: userAgent,
      created_at: createdAt,
    });

    return {
      success: true,
      message: 'Berhasil menyimpan data curah hujan',
      data: insertedRainfall,
    };
  }

  /**
   * Menyimpan data excel curah hujan dan mencatat ke activity log
   */
  async saveExcelRainfall(
    dto: CreateRainfallExcelDto,
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
          row['curah hujan']?.toString().toLowerCase() === 'curah hujan'
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

        const rainfall = parseFloat(row['curah hujan']);
        if (isNaN(rainfall)) {
          console.error('Curah hujan tidak valid untuk data:', row);
          return null;
        }

        return {
          rainfall,
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

    // 5. Simpan data curah hujan ke dalam tabel 'rainfall'
    const { data: insertedRainfall, error: rainfallError } = await this.supabase
      .from('rainfall')
      .insert(dataWithFormattedDate)
      .select();

    if (rainfallError || !insertedRainfall || insertedRainfall.length === 0) {
      return {
        success: false,
        message: 'Gagal menyimpan data curah hujan',
        error: rainfallError,
      };
    }

    // 6. Mencatat ke activity log
    const createdAt = new Date().toLocaleString('en-US', {
      timeZone: 'Asia/Jakarta',
    });

    await this.activityLogService.logActivity({
      admin_id: user_id,
      action: 'Menambahkan Data Curah Hujan',
      description: `${namaAdmin} menambahkan data curah hujan dengan mengunggah file excel.`,
      ip_address: ipAddress,
      user_agent: userAgent,
      created_at: createdAt,
    });

    return {
      success: true,
      message: 'Berhasil menyimpan data curah hujan',
      data: insertedRainfall,
    };
  }

  /**
   * Mengubah data curah hujan dan mencatat ke activity log
   */
  async updateRainfall(
    dto: EditRainfallDto,
    ipAddress: string,
    userAgent: string,
  ) {
    const { id, user_id, date, rainfall } = dto;

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

    // 2. Update data curah hujan berdasarkan id
    const { data: updatedRainfall, error: rainfallError } = await this.supabase
      .from('rainfall')
      .update({ rainfall, date })
      .eq('id', id)
      .select();

    if (rainfallError || !updatedRainfall) {
      return {
        success: false,
        message: 'Gagal mengubah data curah hujan',
        error: rainfallError,
      };
    }

    // 3. Mencatat ke activity log
    const createdAt = new Date().toLocaleString('en-US', {
      timeZone: 'Asia/Jakarta',
    });

    await this.activityLogService.logActivity({
      admin_id: user_id,
      action: 'Mengubah Data Curah Hujan',
      description: `${namaAdmin} mengubah data curah hujan dengan nilai ${rainfall} untuk tanggal ${date}`,
      ip_address: ipAddress,
      user_agent: userAgent,
      created_at: createdAt,
    });

    return {
      success: true,
      message: 'Berhasil mengubah data curah hujan',
      data: updatedRainfall,
    };
  }

  /**
   * Menghapus data curah hujan dan mencatat ke activity log
   */
  async deleteRainfall(
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

    // 2. Ambil data curah hujan (untuk log)
    const { data: rainfallData, error: getRainfallError } = await this.supabase
      .from('rainfall')
      .select('*')
      .eq('id', id)
      .single();

    if (getRainfallError || !rainfallData) {
      return {
        success: false,
        message: 'Data curah hujan tidak ditemukan',
        error: getRainfallError,
      };
    }

    const { rainfall, date } = rainfallData;

    // 3. Hapus data curah hujan berdasarkan id
    const { error: rainfallError } = await this.supabase
      .from('rainfall')
      .delete()
      .eq('id', id)
      .select();

    if (rainfallError) {
      return {
        success: false,
        message: 'Gagal menghapus data curah hujan',
        error: rainfallError,
      };
    }

    // 4. Mencatat ke activity log
    const createdAt = new Date().toLocaleString('en-US', {
      timeZone: 'Asia/Jakarta',
    });

    await this.activityLogService.logActivity({
      admin_id: user_id,
      action: 'Menghapus Data Curah Hujan',
      description: `${namaAdmin} menghapus data curah hujan dengan nilai ${rainfall} untuk tanggal ${date}`,
      ip_address: ipAddress,
      user_agent: userAgent,
      created_at: createdAt,
    });

    return {
      success: true,
      message: 'Berhasil menghapus data curah hujan',
      data: rainfallData,
    };
  }

  /**
   * Mengambil semua data curah hujan
   */
  async getAllRainfall() {
    const { data, error } = await this.supabase.from('rainfall').select('*');

    if (error || !data) {
      return {
        success: false,
        message: 'Gagal mengambil data curah hujan',
        error,
      };
    }

    return {
      success: true,
      message: 'Berhasil mengambil semua data curah hujan',
      data: data,
    };
  }

  /**
   * Mengambil semua data curah hujan berdasarkan id
   */
  async getRainfallById(id: number) {
    const { data, error } = await this.supabase
      .from('rainfall')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return {
        success: false,
        message: 'Gagal mengambil data curah hujan berdasarkan id',
        error,
      };
    }

    return {
      success: true,
      message: 'Berhasil mengambil data curah hujan berdasarkan id',
      data,
    };
  }

  /**
   * Mengambil data curah hujan berdasarkan rentang tanggal
   */
  async getRainfallByDate(dto: FilterRainfallByDateDto) {
    const { start_date, end_date } = dto;

    const { data, error } = await this.supabase
      .from('rainfall')
      .select('*')
      .gte('date', start_date)
      .lte('date', end_date);

    if (error || !data) {
      return {
        success: false,
        message: 'Gagal mengambil data curah hujan berdasarkan rentang tanggal',
        error,
      };
    }

    return {
      success: true,
      message:
        'Berhasil mengambil data curah hujan berdasarkan rentang tanggal',
      data,
    };
  }
}
