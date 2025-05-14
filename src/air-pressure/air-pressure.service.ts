import { Buffer } from 'buffer';
import * as dotenv from 'dotenv';
import * as ExcelJS from 'exceljs';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

import { ActivityLogService } from '@/activity-log/activity-log.service';
import { EditAirPressureDto } from '@/air-pressure/dto/edit-air-pressure.dto';
import { CreateAirPressureDto } from '@/air-pressure/dto/create-air-pressure.dto';
import { AirPressureDataExcel } from '@/air-pressure/interfaces/AirPressureDataExcel';
import { FilterAirPressureByDateDto } from '@/air-pressure/dto/filterAirPressureByDateDto';
import { CreateAirPressureExcelDto } from '@/air-pressure/dto/create-air-pressure-excel.dto';

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
  private parseExcelToData(workbook: ExcelJS.Workbook): AirPressureDataExcel[] {
    const worksheet = workbook.worksheets[0];
    return worksheet
      .getSheetValues()
      .slice(1)
      .filter((row) => row !== null && row !== undefined)
      .map((row) => {
        const jam07 = Number(row[1]);
        const jam13 = Number(row[2]);
        const jam18 = Number(row[3]);
        const tanggal = row[4];

        return {
          '7:00': jam07,
          '13:00': jam13,
          '18:00': jam18,
          tanggal: tanggal,
        };
      });
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
      date,
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
          date,
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
      description: `${namaAdmin} menambahkan data tekanan udara sebesar ${air_pressure}, dengan rincian: 07.00 = ${air_pressure_07}, 13.00 = ${air_pressure_13}, 18.00 = ${air_pressure_18}. Data ini telah disimpan pada tanggal ${date}.`,
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
   * Menyimpan data excel tekanan udara dan mencatat ke activity log
   */
  async saveExcelAirPressure(
    dto: CreateAirPressureExcelDto,
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
          row['7:00']?.toString().toLowerCase() === '7:00' ||
          row['13:00']?.toString().toLowerCase() === '13:00' ||
          row['18:00']?.toString().toLowerCase() === '18:00' ||
          row['tanggal']?.toString().toLowerCase() === 'tanggal'
        ) {
          return null;
        }

        const time07 = parseFloat(String(row['7:00']));
        if (isNaN(time07)) {
          console.error('Nilai 07:00 tidak valid:', row);
          return null;
        }

        const time13 = parseFloat(String(row['13:00']));
        if (isNaN(time13)) {
          console.error('Nilai 13:00 tidak valid:', row);
          return null;
        }

        const time18 = parseFloat(String(row['18:00']));
        if (isNaN(time18)) {
          console.error('Nilai 18:00 tidak valid:', row);
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

        const air_pressure = parseFloat(
          ((time07 + time13 + time18) / 3).toFixed(2),
        );

        return {
          air_pressure,
          air_pressure_07: time07,
          air_pressure_13: time13,
          air_pressure_18: time18,
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

    // 5. Simpan data kelembapan ke dalam tabel 'air_pressure'
    const { data: insertedAirPressure, error: airPressureError } =
      await this.supabase
        .from('air_pressure')
        .insert(dataWithFormattedDate)
        .select();

    if (
      airPressureError ||
      !insertedAirPressure ||
      insertedAirPressure.length === 0
    ) {
      return {
        success: false,
        message: 'Gagal menyimpan data tekanan udara',
        error: airPressureError,
      };
    }

    // 6. Mencatat ke activity log
    const createdAt = new Date().toLocaleString('en-US', {
      timeZone: 'Asia/Jakarta',
    });

    await this.activityLogService.logActivity({
      admin_id: user_id,
      action: 'Menambahkan Data Tekanan Udara',
      description: `${namaAdmin} menambahkan data tekanan udara dengan mengunggah file excel.`,
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
      date,
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
          date,
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
    const { error: airPressureError } = await this.supabase
      .from('air_pressure')
      .delete()
      .eq('id', id)
      .select();

    if (airPressureError) {
      return {
        success: false,
        message: 'Gagal menghapus data tekanan udara',
        error: airPressureError,
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

  /**
   * Mengambil data tekanan udara berdasarkan rentang tanggal tekanan udara
   */
  async getAirPressureByDate(dto: FilterAirPressureByDateDto) {
    const { start_date, end_date } = dto;

    const { data, error } = await this.supabase
      .from('air_pressure')
      .select('*')
      .gte('date', start_date)
      .lte('date', end_date);

    if (error || !data) {
      return {
        success: false,
        message:
          'Gagal mengambil data tekanan udara berdasarkan rentang tanggal tekanan udara',
        error,
      };
    }

    return {
      success: true,
      message:
        'Berhasil mengambil data tekanan udara berdasarkan rentang tanggal tekanan udara',
      data,
    };
  }
}
