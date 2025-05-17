import { Buffer } from 'buffer';
import * as dotenv from 'dotenv';
import * as ExcelJS from 'exceljs';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

import { ActivityLogService } from '@/activity-log/activity-log.service';
import { EditAverageTemperatureDto } from '@/average-temperature/dto/edit-average-temperature.dto';
import { CreateAverageTemperatureDto } from '@/average-temperature/dto/create-average-temperature.dto';
import { AverageTemperatureDataExcel } from '@/average-temperature/interfaces/AverageTemperatureDataExcel';
import { FilterAverageTemperatureByDateDto } from '@/average-temperature/dto/filterAverageTemperatureByDateDto';
import { CreateAverageTemperatureExcelDto } from '@/average-temperature/dto/create-average-temperature-excel.dto';

dotenv.config();

@Injectable()
export class AverageTemperatureService {
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
  ): AverageTemperatureDataExcel[] {
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
   * Menyimpan data temperatur rata rata dan mencatat ke activity log
   */
  async saveAverageTemperature(
    dto: CreateAverageTemperatureDto,
    ipAddress: string,
    userAgent: string,
  ) {
    const {
      user_id,
      avg_temperature_07,
      avg_temperature_13,
      avg_temperature_18,
      date,
    } = dto;

    const avg_temperature = parseFloat(
      (
        (avg_temperature_07 + avg_temperature_13 + avg_temperature_18) /
        3
      ).toFixed(2),
    );

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

    // 2. Simpan data temperatur rata rata
    const { data: insertedAvgTemperature, error: insertError } =
      await this.supabase
        .from('average_temperature')
        .insert([
          {
            avg_temperature,
            avg_temperature_07,
            avg_temperature_13,
            avg_temperature_18,
            date,
          },
        ])

        .select();

    if (insertError) {
      return {
        success: false,
        message: 'Gagal menyimpan data temperatur rata rata',
        error: insertError,
      };
    }

    // 3. Mencatat ke activity log
    const createdAt = new Date().toLocaleString('en-US', {
      timeZone: 'Asia/Jakarta',
    });

    await this.activityLogService.logActivity({
      admin_id: user_id,
      action: 'Menambahkan Data Temperatur Rata-Rata',
      description: `${namaAdmin} menambahkan data temperatur rata-rata sebesar ${avg_temperature}°C, yang diukur pada pukul ${avg_temperature_07}, ${avg_temperature_13}, dan ${avg_temperature_18}.`,
      ip_address: ipAddress,
      user_agent: userAgent,
      created_at: createdAt,
    });

    return {
      success: true,
      message: 'Berhasil menyimpan data temperatur rata rata',
      data: insertedAvgTemperature,
    };
  }

  /**
   * Menyimpan data excel temperatur rata rata dan mencatat ke activity log
   */
  async saveExcelAverageTemperature(
    dto: CreateAverageTemperatureExcelDto,
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

        const averageTemperature = parseFloat(
          ((time07 + time13 + time18) / 3).toFixed(2),
        );

        return {
          avg_temperature: averageTemperature,
          avg_temperature_07: time07,
          avg_temperature_13: time13,
          avg_temperature_18: time18,
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

    // 5. Simpan data temperatur rata rata ke dalam tabel 'average_temperature'
    const {
      data: insertedAverageTemperaturePressure,
      error: averageTemperaturePressureError,
    } = await this.supabase
      .from('average_temperature')
      .insert(dataWithFormattedDate)
      .select();

    if (
      averageTemperaturePressureError ||
      !insertedAverageTemperaturePressure ||
      insertedAverageTemperaturePressure.length === 0
    ) {
      return {
        success: false,
        message: 'Gagal menyimpan data temperatur rata rata',
        error: averageTemperaturePressureError,
      };
    }

    // 6. Mencatat ke activity log
    const createdAt = new Date().toLocaleString('en-US', {
      timeZone: 'Asia/Jakarta',
    });

    await this.activityLogService.logActivity({
      admin_id: user_id,
      action: 'Menambahkan Data Temperatur Rata Rata',
      description: `${namaAdmin} menambahkan data temperatur rata rata dengan mengunggah file excel.`,
      ip_address: ipAddress,
      user_agent: userAgent,
      created_at: createdAt,
    });

    return {
      success: true,
      message: 'Berhasil menyimpan data temperatur rata rata',
      data: insertedAverageTemperaturePressure,
    };
  }

  /**
   * Mengubah data temperatur rata rata dan mencatat ke activity log
   */
  async updateAverageTemperature(
    dto: EditAverageTemperatureDto,
    ipAddress: string,
    userAgent: string,
  ) {
    const {
      id,
      user_id,
      avg_temperature_07,
      avg_temperature_13,
      avg_temperature_18,
      date,
    } = dto;

    const avg_temperature = parseFloat(
      (
        (avg_temperature_07 + avg_temperature_13 + avg_temperature_18) /
        3
      ).toFixed(2),
    );

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

    // 2. Update data temperatur rata rata berdasarkan id
    const { data: updatedAvgTemperature, error: updateError } =
      await this.supabase
        .from('average_temperature')
        .update({
          avg_temperature,
          avg_temperature_07,
          avg_temperature_13,
          avg_temperature_18,
          date,
        })
        .eq('id', id)
        .select();

    if (updateError) {
      return {
        success: false,
        message: 'Gagal mengubah data temperatur rata rata',
        error: updateError,
      };
    }

    // 3. Mencatat ke activity log
    const createdAt = new Date().toLocaleString('en-US', {
      timeZone: 'Asia/Jakarta',
    });

    await this.activityLogService.logActivity({
      admin_id: user_id,
      action: 'Mengubah Data Temperatur Rata-Rata',
      description: `${namaAdmin} mengubah data temperatur rata-rata sebesar ${avg_temperature}°C, yang diukur pada pukul ${avg_temperature_07}, ${avg_temperature_13}, dan ${avg_temperature_18}.`,
      ip_address: ipAddress,
      user_agent: userAgent,
      created_at: createdAt,
    });

    return {
      success: true,
      message: 'Berhasil mengubah data temperatur rata rata',
      data: updatedAvgTemperature,
    };
  }

  /**
   * Menghapus data temperatur rata rata dan mencatat ke activity log
   */
  async deleteAverageTemperature(
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

    // 2. Ambil data temperatur rata rata (untuk log)
    const { data: avgTemperatureData, error: getAvgTemperatureError } =
      await this.supabase
        .from('average_temperature')
        .select('*')
        .eq('id', id)
        .single();

    if (getAvgTemperatureError) {
      return {
        success: false,
        message: 'Gagal mengambil data temperatur rata rata',
        error: getAvgTemperatureError,
      };
    }

    const {
      avg_temperature,
      avg_temperature_07,
      avg_temperature_13,
      avg_temperature_18,
    } = avgTemperatureData;

    // 3. Hapus data temperatur rata rata berdasarkan id
    const { error: deleteError } = await this.supabase
      .from('average_temperature')
      .delete()
      .eq('id', id);

    if (deleteError) {
      return {
        success: false,
        message: 'Gagal menghapus data temperatur rata rata',
        error: deleteError,
      };
    }

    // 4. Mencatat ke activity log
    const createdAt = new Date().toLocaleString('en-US', {
      timeZone: 'Asia/Jakarta',
    });

    await this.activityLogService.logActivity({
      admin_id: user_id,
      action: 'Menghapus Data Temperatur Rata-Rata',
      description: `${namaAdmin} menghapus data temperatur rata-rata sebesar ${avg_temperature}°C, yang diukur pada pukul ${avg_temperature_07}, ${avg_temperature_13}, dan ${avg_temperature_18}.`,
      ip_address: ipAddress,
      user_agent: userAgent,
      created_at: createdAt,
    });

    return {
      success: true,
      message: 'Berhasil menghapus data temperatur rata rata',
      data: avgTemperatureData,
    };
  }

  /**
   * Mengambil semua data temperatur rata rata
   */
  async getAllAverageTemperature() {
    const { data, error } = await this.supabase
      .from('average_temperature')
      .select('*');

    if (error || !data) {
      return {
        success: false,
        message: 'Gagal mengambil data temperatur rata rata',
        error,
      };
    }

    return {
      success: true,
      message: 'Berhasil mengambil semua data temperatur rata rata',
      data: data,
    };
  }

  /**
   * Mengambil semua data temperatur rata rata berdasarkan id
   */
  async getAverageTemperatureById(id: number) {
    const { data, error } = await this.supabase
      .from('average_temperature')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return {
        success: false,
        message: 'Gagal mengambil data temperatur rata rata berdasarkan id',
        error,
      };
    }

    return {
      success: true,
      message: 'Berhasil mengambil data temperatur rata rata berdasarkan id',
      data,
    };
  }

  /**
   * Mengambil data temperatur rata rata berdasarkan rentang tanggal temperatur rata rata
   */
  async getAverageTemperatureByDate(dto: FilterAverageTemperatureByDateDto) {
    const { start_date, end_date } = dto;

    const { data, error } = await this.supabase
      .from('average_temperature')
      .select('*')
      .gte('date', start_date)
      .lte('date', end_date);

    if (error || !data) {
      return {
        success: false,
        message:
          'Gagal mengambil data temperatur rata rata berdasarkan rentang tanggal temperatur rata rata',
        error,
      };
    }

    return {
      success: true,
      message:
        'Berhasil mengambil data temperatur rata rata berdasarkan rentang tanggal temperatur rata rata',
      data,
    };
  }
}
