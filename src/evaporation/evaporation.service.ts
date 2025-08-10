import { Buffer } from 'buffer';
import * as dotenv from 'dotenv';
import * as ExcelJS from 'exceljs';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

import { ActivityLogService } from '@/activity-log/activity-log.service';
import { EditEvaporationDto } from '@/evaporation/dto/edit-evaporation.dto';
import { CreateEvaporationDto } from '@/evaporation/dto/create-evaporation.dto';
import { EvaporationDataExcel } from '@/evaporation/interfaces/EvaporationDataExcel';
import { FilterEvaporationByDateDto } from '@/evaporation/dto/filterEvaporationByDateDto';
import { CreateEvaporationExcelDto } from '@/evaporation/dto/create-evaporation-excel.dto';

dotenv.config();

@Injectable()
export class EvaporationService {
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
  private parseExcelToData(workbook: ExcelJS.Workbook): EvaporationDataExcel[] {
    const worksheet = workbook.worksheets[0];
    return worksheet
      .getSheetValues()
      .slice(1)
      .filter((row) => row !== null && row !== undefined)
      .map((row) => ({
        penguapan: row[1],
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
   * Menyimpan data penguapan dan mencatat ke activity log
   */
  async saveEvaporation(
    dto: CreateEvaporationDto,
    ipAddress: string,
    userAgent: string,
  ) {
    const { user_id, date, evaporation } = dto;

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

    // 2. Simpan data evaporation dengan select()
    const { data: insertedEvaporation, error: evaporationError } =
      await this.supabase
        .from('evaporation')
        .insert({
          date,
          evaporation,
        })
        .select()
        .single();

    if (evaporationError) {
      return {
        success: false,
        message: 'Gagal menyimpan data penguapan',
        error: evaporationError,
      };
    }

    // 3. Catat ke activity log
    const createdAt = new Date().toLocaleString('en-US', {
      timeZone: 'Asia/Jakarta',
    });

    await this.activityLogService.logActivity({
      admin_id: user_id,
      action: 'Menambahkan Data Penguapan',
      description: `${namaAdmin} menambahkan data penguapan dengan nilai ${evaporation} untuk tanggal ${date}`,
      ip_address: ipAddress,
      user_agent: userAgent,
      created_at: createdAt,
    });

    return {
      success: true,
      message: 'Berhasil menyimpan data penguapan',
      data: insertedEvaporation,
    };
  }

  /**
   * Menyimpan data excel penguapan dan mencatat ke activity log
   */
  async saveExcelEvaporation(
    dto: CreateEvaporationExcelDto,
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
          row['penguapan']?.toString().toLowerCase() === 'penguapan'
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

        const evaporation = row['penguapan'];
        if (isNaN(evaporation)) {
          console.error('Penguapan tidak valid untuk data:', row);
          return null;
        }

        return {
          evaporation,
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

    // 5. Simpan data penguapan ke dalam tabel 'evaporation'
    const { data: insertedEvaporation, error: evaporationError } =
      await this.supabase
        .from('evaporation')
        .insert(dataWithFormattedDate)
        .select();

    if (
      evaporationError ||
      !insertedEvaporation ||
      insertedEvaporation.length === 0
    ) {
      return {
        success: false,
        message: 'Gagal menyimpan data penguapan',
        error: evaporationError,
      };
    }

    // 6. Mencatat ke activity log
    const createdAt = new Date().toLocaleString('en-US', {
      timeZone: 'Asia/Jakarta',
    });

    await this.activityLogService.logActivity({
      admin_id: user_id,
      action: 'Menambahkan Data Penguapan',
      description: `${namaAdmin} menambahkan data penguapan dengan mengunggah file excel.`,
      ip_address: ipAddress,
      user_agent: userAgent,
      created_at: createdAt,
    });

    return {
      success: true,
      message: 'Berhasil menyimpan data penguapan',
      data: insertedEvaporation,
    };
  }

  /**
   * Mengubah data penguapan dan mencatat ke activity log
   */
  async updateEvaporation(
    dto: EditEvaporationDto,
    ipAddress: string,
    userAgent: string,
  ) {
    const { id, user_id, date, evaporation } = dto;

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

    // 2. Update data evaporation berdasarkan id
    const { data: updatedEvaporation, error: evaporationError } =
      await this.supabase
        .from('evaporation')
        .update({ evaporation, date })
        .eq('id', id)
        .select()
        .single();

    if (evaporationError) {
      return {
        success: false,
        message: 'Gagal mengubah data penguapan',
        error: evaporationError,
      };
    }

    // 3. Catat ke activity log
    const updatedAt = new Date().toLocaleString('en-US', {
      timeZone: 'Asia/Jakarta',
    });

    await this.activityLogService.logActivity({
      admin_id: user_id,
      action: 'Mengubah Data Penguapan',
      description: `${namaAdmin} mengubah nilai penguapan menjadi ${evaporation} untuk tanggal ${date}`,
      ip_address: ipAddress,
      user_agent: userAgent,
      created_at: updatedAt,
    });

    return {
      success: true,
      message: 'Berhasil memperbarui data penguapan',
      data: updatedEvaporation,
    };
  }

  /**
   * Menghapus data penguapan dan mencatat ke activity log
   */
  async deleteEvaporation(
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

    // 2. Ambil data penguapan (untuk log)
    const { data: evaporationData, error: getEvaporationError } =
      await this.supabase.from('evaporation').select('*').eq('id', id).single();

    if (getEvaporationError || !evaporationData) {
      return {
        success: false,
        message: 'Data evaporation tidak ditemukan',
        error: getEvaporationError,
      };
    }

    const { date, evaporation } = evaporationData;

    // 3. Hapus data evaporation
    const { error: evaporationError } = await this.supabase
      .from('evaporation')
      .delete()
      .eq('id', id);

    if (evaporationError) {
      return {
        success: false,
        message: 'Gagal menghapus data penguapan',
        error: evaporationError,
      };
    }

    // 4. Catat ke activity log
    const deletedAt = new Date().toLocaleString('en-US', {
      timeZone: 'Asia/Jakarta',
    });

    await this.activityLogService.logActivity({
      admin_id: user_id,
      action: 'Menghapus Data Penguapan',
      description: `${namaAdmin} menghapus data penguapan dengan nilai ${evaporation} untuk tanggal ${date}`,
      ip_address: ipAddress,
      user_agent: userAgent,
      created_at: deletedAt,
    });

    return {
      success: true,
      message: 'Berhasil menghapus data penguapan',
      data: evaporationData,
    };
  }

  /**
   * Mengambil semua data evaporation
   */
  async getAllEvaporation() {
    const { data, error } = await this.supabase.from('evaporation').select(`*`);

    if (error || !data) {
      return {
        success: false,
        message: 'Gagal mengambil data penguapan',
        error,
      };
    }

    return {
      success: true,
      message: 'Berhasil mengambil semua data penguapan',
      data: data,
    };
  }

  /**
   * Mengambil semua data evaporation berdasarkan id
   */
  async getEvaporationById(id: number) {
    const { data, error } = await this.supabase
      .from('evaporation')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return {
        success: false,
        message: 'Gagal mengambil data penguapan berdasarkan id',
        error,
      };
    }

    return {
      success: true,
      message: 'Berhasil mengambil data penguapan berdasarkan id',
      data,
    };
  }

  /**
   * Mengambil data penguapan berdasarkan rentang tanggal
   */
  async getEvaporationByDate(dto: FilterEvaporationByDateDto) {
    const { start_date, end_date } = dto;

    const { data, error } = await this.supabase
      .from('evaporation')
      .select('*')
      .gte('date', start_date)
      .lte('date', end_date);

    if (error || !data) {
      return {
        success: false,
        message: 'Gagal mengambil data penguapan berdasarkan rentang tanggal',
        error,
      };
    }

    return {
      success: true,
      message: 'Berhasil mengambil data penguapan berdasarkan rentang tanggal',
      data,
    };
  }
}
