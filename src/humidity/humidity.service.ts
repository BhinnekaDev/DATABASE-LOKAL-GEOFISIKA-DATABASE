import { Buffer } from 'buffer';
import * as dotenv from 'dotenv';
import * as ExcelJS from 'exceljs';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

import { EditHumidityDto } from '@/humidity/dto/edit-humidity.dto';
import { CreateHumidityDto } from '@/humidity/dto/create-humidity.dto';
import { ActivityLogService } from '@/activity-log/activity-log.service';
import { HumidityDataExcel } from '@/humidity/interfaces/HumidityDataExcel';
import { FilterHumidityByDateDto } from '@/humidity/dto/filterHumidityByDateDto';
import { CreateHumidityExcelDto } from '@/humidity/dto/create-humidity-excel.dto';

dotenv.config();

@Injectable()
export class HumidityService {
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
  private parseExcelToData(workbook: ExcelJS.Workbook): HumidityDataExcel[] {
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
   * Menyimpan data kelembapan dan mencatat ke activity log
   */
  async saveHumidity(
    dto: CreateHumidityDto,
    ipAddress: string,
    userAgent: string,
  ) {
    const { user_id, humidity_07, humidity_13, humidity_18, date } = dto;

    const avg_humidity = parseFloat(
      ((humidity_07 + humidity_13 + humidity_18) / 3).toFixed(2),
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

    // 2. Simpan data kelembapan
    const { data: insertedHumidity, error: humidityError } = await this.supabase
      .from('humidity')
      .insert({
        avg_humidity,
        humidity_07,
        humidity_13,
        humidity_18,
        date,
      })
      .select()
      .single();

    if (humidityError || !insertedHumidity) {
      return {
        success: false,
        message: 'Gagal menyimpan data kelembapan',
        error: humidityError,
      };
    }

    // 3. Mencatat ke activity log
    const createdAt = new Date().toLocaleString('en-US', {
      timeZone: 'Asia/Jakarta',
    });

    await this.activityLogService.logActivity({
      admin_id: user_id,
      action: 'Menambahkan Data Kelembapan',
      description: `${namaAdmin} menambahkan data kelembapan dengan rata-rata ${avg_humidity}%. Rincian kelembapan tercatat pada pukul 07:00 sebesar ${humidity_07}%, pukul 13:00 sebesar ${humidity_13}%, dan pukul 18:00 sebesar ${humidity_18}%.`,
      ip_address: ipAddress,
      user_agent: userAgent,
      created_at: createdAt,
    });

    return {
      success: true,
      message: 'Berhasil menyimpan data kelembapan',
      data: insertedHumidity,
    };
  }

  /**
   * Menyimpan data excel kelembapan dan mencatat ke activity log
   */
  async saveExcelHumidity(
    dto: CreateHumidityExcelDto,
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

        const avg_humidity = parseFloat(
          ((time07 + time13 + time18) / 3).toFixed(2),
        );

        return {
          avg_humidity,
          humidity_07: time07,
          humidity_13: time13,
          humidity_18: time18,
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

    // 5. Simpan data kelembapan ke dalam tabel 'humidity'
    const { data: insertedHumidity, error: humidityError } = await this.supabase
      .from('humidity')
      .insert(dataWithFormattedDate)
      .select();

    if (humidityError || !insertedHumidity || insertedHumidity.length === 0) {
      return {
        success: false,
        message: 'Gagal menyimpan data kelembapan',
        error: humidityError,
      };
    }

    // 6. Mencatat ke activity log
    const createdAt = new Date().toLocaleString('en-US', {
      timeZone: 'Asia/Jakarta',
    });

    await this.activityLogService.logActivity({
      admin_id: user_id,
      action: 'Menambahkan Data Kelembapan',
      description: `${namaAdmin} menambahkan data kelembapan dengan mengunggah file excel.`,
      ip_address: ipAddress,
      user_agent: userAgent,
      created_at: createdAt,
    });

    return {
      success: true,
      message: 'Berhasil menyimpan data kelembapan',
      data: insertedHumidity,
    };
  }

  /**
   * Mengubah data kelembapan dan mencatat ke activity log
   */
  async updateHumidity(
    dto: EditHumidityDto,
    ipAddress: string,
    userAgent: string,
  ) {
    const { id, user_id, humidity_07, humidity_13, humidity_18, date } = dto;

    const avg_humidity = parseFloat(
      ((humidity_07 + humidity_13 + humidity_18) / 3).toFixed(2),
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

    // 2. Update data kelembapan berdasarkan id
    const { data: updatedHumidity, error: humidityError } = await this.supabase
      .from('humidity')
      .update({
        avg_humidity,
        humidity_07,
        humidity_13,
        humidity_18,
        date,
      })
      .eq('id', id)
      .select()
      .single();

    if (humidityError || !updatedHumidity) {
      return {
        success: false,
        message: 'Gagal memperbarui data kelembapan',
        error: humidityError,
      };
    }

    // 3. Catat ke activity log
    const updatedAt = new Date().toLocaleString('en-US', {
      timeZone: 'Asia/Jakarta',
    });

    await this.activityLogService.logActivity({
      admin_id: user_id,
      action: 'Mengubah Data Kelembapan',
      description: `${namaAdmin} mengubah data kelembapan dengan rata-rata ${avg_humidity}%. Rincian kelembapan tercatat pada pukul 07:00 sebesar ${humidity_07}%, pukul 13:00 sebesar ${humidity_13}%, dan pukul 18:00 sebesar ${humidity_18}%.`,
      ip_address: ipAddress,
      user_agent: userAgent,
      created_at: updatedAt,
    });

    return {
      success: true,
      message: 'Berhasil memperbarui data kelembapan',
      data: updatedHumidity,
    };
  }

  /**
   * Menghapus data kelembapan dan mencatat ke activity log
   */
  async deleteHumidity(
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

    // 2. Ambil data kelembapan (untuk log)
    const { data: humidityData, error: getHumidityError } = await this.supabase
      .from('humidity')
      .select('*')
      .eq('id', id)
      .single();

    if (getHumidityError || !humidityData) {
      return {
        success: false,
        message: 'Gagal mengambil data kelembapan',
        error: getHumidityError,
      };
    }

    const { avg_humidity, humidity_07, humidity_13, humidity_18 } =
      humidityData;

    // 3. Hapus data kelembapan
    const { error: deleteHumidityError } = await this.supabase
      .from('humidity')
      .delete()
      .eq('id', id);

    if (deleteHumidityError) {
      return {
        success: false,
        message: 'Gagal menghapus data kelembapan',
        error: deleteHumidityError,
      };
    }

    // 4. Catat ke activity log
    const deletedAt = new Date().toLocaleString('en-US', {
      timeZone: 'Asia/Jakarta',
    });

    await this.activityLogService.logActivity({
      admin_id: user_id,
      action: 'Menghapus Data Kelembapan',
      description: `${namaAdmin} menghapus data kelembapan dengan rata-rata ${avg_humidity}%. Rincian kelembapan tercatat pada pukul 07:00 sebesar ${humidity_07}%, pukul 13:00 sebesar ${humidity_13}%, dan pukul 18:00 sebesar ${humidity_18}%.`,
      ip_address: ipAddress,
      user_agent: userAgent,
      created_at: deletedAt,
    });

    return {
      success: true,
      message: 'Berhasil menghapus data kelembapan',
      data: humidityData,
    };
  }

  /**
   * Mengambil semua data humidity
   */
  async getAllHumidity() {
    const { data, error } = await this.supabase.from('humidity').select(`*`);

    if (error || !data) {
      return {
        success: false,
        message: 'Gagal mengambil data kelembapan',
        error,
      };
    }

    return {
      success: true,
      message: 'Berhasil mengambil semua data kelembapan',
      data: data,
    };
  }

  /**
   * Mengambil semua data humidity berdasarkan id
   */
  async getHumidityById(id: number) {
    const { data, error } = await this.supabase
      .from('humidity')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return {
        success: false,
        message: 'Gagal mengambil data kelembapan berdasarkan id',
        error,
      };
    }

    return {
      success: true,
      message: 'Berhasil mengambil data kelembapan berdasarkan id',
      data,
    };
  }

  /**
   * Mengambil data kelembapan berdasarkan rentang tanggal kelembapan
   */
  async getHumidityByDate(dto: FilterHumidityByDateDto) {
    const { start_date, end_date } = dto;

    const { data, error } = await this.supabase
      .from('humidity')
      .select('*')
      .gte('date', start_date)
      .lte('date', end_date);

    if (error || !data) {
      return {
        success: false,
        message:
          'Gagal mengambil data kelembapan berdasarkan rentang tanggal kelembapan',
        error,
      };
    }

    return {
      success: true,
      message:
        'Berhasil mengambil data kelembapan berdasarkan rentang tanngal kelembapan',
      data,
    };
  }
}
