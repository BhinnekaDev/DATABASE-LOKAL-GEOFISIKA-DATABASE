import { Buffer } from 'buffer';
import * as dotenv from 'dotenv';
import * as ExcelJS from 'exceljs';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

import { EditEarthquakeDto } from '@/earthquake/dto/edit-earthquake.dto';
import { ActivityLogService } from '@/activity-log/activity-log.service';
import { CreateEarthquakeDto } from '@/earthquake/dto/create-earthquake.dto';
import { EarthquakeDataExcel } from '@/earthquake/interfaces/EarthquakeDataExcel';
import { FilterEarthquakeByDateDto } from '@/earthquake/dto/filterEarthquakeByDateDto';
import { CreateEarthquakeParseDto } from '@/earthquake/dto/create-earthquake-parse.dto';
import { CreateEarthquakeExcelDto } from '@/earthquake/dto/create-earthquake-excel.dto';

dotenv.config();

@Injectable()
export class EarthquakeService {
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
  private parseExcelToData(workbook: ExcelJS.Workbook): EarthquakeDataExcel[] {
    const worksheet = workbook.worksheets[0];
    return worksheet
      .getSheetValues()
      .slice(1)
      .filter((row) => row !== null && row !== undefined)
      .map((row) => ({
        waktu: row[1],
        mmi: row[2],
        deskripsi: row[3],
        'kedalaman (km)': row[4],
        lintang: row[5],
        bujur: row[6],
        magnitudo: row[7],
        'nama pengamat': row[8],
        tanggal: row[9],
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
   * Mengubah format string input menjadi objek Earthquake
   */
  private parseEarthquakeInput(input: string) {
    const regex =
      /Mag:([\d.]+),\s(\d{2}-[a-zA-Z]{3}-\d{2})\s(\d{2}:\d{2}:\d{2})\sWIB,\sLok:([\d.]+)\sLS\s-\s([\d.]+)\sBT\s\((\d+)\skm\s([^)]+)\),\sKedlmn:\s(\d+)KM\s::([A-Z]+)/;

    const matches = input.match(regex);

    if (!matches) {
      throw new Error('Format input tidak valid');
    }

    const magnitude = parseFloat(matches[1]);
    const date = this.parseDate(matches[2]);
    const time = matches[3];
    const latitude = parseFloat(matches[4].replace(',', '.'));
    const longitude = parseFloat(matches[5].replace(',', '.'));
    const depth = parseInt(matches[8], 10);
    const description = matches[7].trim();
    const observer_name = matches[9].trim();

    return {
      magnitude,
      date,
      time,
      latitude,
      longitude,
      depth,
      description,
      observer_name,
    };
  }

  /**
   * Mengubah format string tanggal menjadi objek Date
   */
  private parseDate(dateStr: string): Date {
    // Contoh format: 13-mar-25
    const [day, month, year] = dateStr.split('-');
    const months = [
      'jan',
      'feb',
      'mar',
      'apr',
      'mei',
      'jun',
      'jul',
      'agu',
      'sep',
      'okt',
      'nov',
      'des',
    ];
    const monthIndex = months.indexOf(month.toLowerCase());

    if (monthIndex === -1) {
      throw new Error('Bulan tidak valid');
    }

    const fullYear = 2000 + parseInt(year, 10);

    return new Date(fullYear, monthIndex, parseInt(day, 10));
  }

  /**
   * Menyimpan data gempa dan mencatat ke activity log
   */
  async saveEarthquake(
    dto: CreateEarthquakeDto,
    ipAddress: string,
    userAgent: string,
  ) {
    const {
      user_id,
      date,
      time,
      mmi,
      description,
      depth,
      latitude,
      longitude,
      magnitude,
      observer_name,
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

    // 2. Simpan data gempa
    const { data: insertedEarthquake, error: earthquakeError } =
      await this.supabase
        .from('earthquake')
        .insert({
          date,
          time,
          mmi,
          description,
          depth,
          latitude,
          longitude,
          magnitude,
          observer_name,
        })
        .select();

    if (earthquakeError || !insertedEarthquake) {
      return {
        success: false,
        message: 'Gagal menyimpan data gempa',
        error: earthquakeError ? earthquakeError.message : 'Unknown error',
      };
    }

    // 3. Mencatat ke activity log
    const createdAt = new Date().toLocaleString('en-US', {
      timeZone: 'Asia/Jakarta',
    });

    await this.activityLogService.logActivity({
      admin_id: user_id,
      action: 'Menambahkan Data Gempa',
      description: `${namaAdmin} menambahkan data gempa dengan tingkat intensitas ${mmi}, terdeteksi pada koordinat (${latitude}, ${longitude}), dengan kedalaman ${depth} km.`,
      ip_address: ipAddress,
      user_agent: userAgent,
      created_at: createdAt,
    });

    return {
      success: true,
      message: 'Berhasil menyimpan data gempa',
      data: insertedEarthquake,
    };
  }

  /**
   * Menyimpan data gempa dengan parsing dan mencatat ke activity log
   */
  async saveEarthquakeParse(
    dto: CreateEarthquakeParseDto,
    ipAddress: string,
    userAgent: string,
  ) {
    const { input, user_id } = dto;

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

    // 2. Parsing inputan
    const {
      magnitude,
      date,
      time,
      latitude,
      longitude,
      depth,
      description,
      observer_name,
    } = this.parseEarthquakeInput(input);

    // 3. Simpan data gempa
    const { data: insertedEarthquake, error: earthquakeError } =
      await this.supabase
        .from('earthquake')
        .insert({
          date,
          time,
          magnitude,
          description,
          depth,
          latitude,
          longitude,
          observer_name,
        })
        .select();

    if (earthquakeError || !insertedEarthquake) {
      return {
        success: false,
        message: 'Gagal menyimpan data gempa',
        error: earthquakeError ? earthquakeError.message : 'Unknown error',
      };
    }

    // 4. Mencatat ke activity log
    const createdAt = new Date().toLocaleString('en-US', {
      timeZone: 'Asia/Jakarta',
    });

    await this.activityLogService.logActivity({
      admin_id: user_id,
      action: 'Menambahkan Data Gempa',
      description: `${namaAdmin} menambahkan data gempa dengan tingkat intensitas ${magnitude}, terdeteksi pada koordinat (${latitude}, ${longitude}), dengan kedalaman ${depth} km.`,
      ip_address: ipAddress,
      user_agent: userAgent,
      created_at: createdAt,
    });

    return {
      success: true,
      message: 'Berhasil menyimpan data gempa',
      data: insertedEarthquake,
    };
  }

  /**
   * Menyimpan data excel gempa dan mencatat ke activity log
   */
  async saveExcelEarthquake(
    dto: CreateEarthquakeExcelDto,
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
          row['waktu']?.toString().toLowerCase() === 'waktu' ||
          row['mmi']?.toString().toLowerCase() === 'mmi' ||
          row['deskripsi']?.toString().toLowerCase() === 'deskripsi' ||
          row['kedalaman (km)']?.toString().toLowerCase() ===
            'kedalaman (km)' ||
          row['lintang']?.toString().toLowerCase() === 'lintang' ||
          row['bujur']?.toString().toLowerCase() === 'bujur' ||
          row['magnitudo']?.toString().toLowerCase() === 'magnitudo' ||
          row['nama pengamat']?.toString().toLowerCase() === 'nama pengamat'
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

        const time = row['waktu'];
        if (!time) {
          console.error('waktu tidak valid untuk data:', row);
          return null;
        }

        const mmi = row['mmi'];
        if (!mmi) {
          console.error('mmi tidak valid untuk data:', row);
          return null;
        }

        const description = row['deskripsi'];
        if (!description) {
          console.error('deskripsi tidak valid untuk data:', row);
          return null;
        }

        const depth = row['kedalaman (km)'];
        if (isNaN(depth)) {
          console.error('kedalaman tidak valid untuk data:', row);
          return null;
        }

        const latitude = row['lintang'];
        if (isNaN(latitude)) {
          console.error('lintang tidak valid untuk data:', row);
          return null;
        }

        const longitude = row['bujur'];
        if (isNaN(longitude)) {
          console.error('bujur tidak valid untuk data:', row);
          return null;
        }

        const magnitude = row['magnitudo'];
        if (isNaN(magnitude)) {
          console.error('magnitudo tidak valid untuk data:', row);
          return null;
        }

        const observerName = row['nama pengamat'];
        if (!observerName) {
          console.error('nama pengamat tidak valid untuk data:', row);
          return null;
        }

        return {
          time,
          mmi,
          description,
          depth,
          latitude,
          longitude,
          magnitude,
          observer_name: observerName,
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

    // 5. Simpan data gempa ke dalam tabel 'earthquake'
    const { data: earthquakeEvaporation, error: earthquakeError } =
      await this.supabase
        .from('earthquake')
        .insert(dataWithFormattedDate)
        .select();

    if (
      earthquakeError ||
      !earthquakeEvaporation ||
      earthquakeEvaporation.length === 0
    ) {
      return {
        success: false,
        message: 'Gagal menyimpan data gempa',
        error: earthquakeError,
      };
    }

    // 6. Mencatat ke activity log
    const createdAt = new Date().toLocaleString('en-US', {
      timeZone: 'Asia/Jakarta',
    });

    await this.activityLogService.logActivity({
      admin_id: user_id,
      action: 'Menambahkan Data Gempa',
      description: `${namaAdmin} menambahkan data gempa dengan mengunggah file excel.`,
      ip_address: ipAddress,
      user_agent: userAgent,
      created_at: createdAt,
    });

    return {
      success: true,
      message: 'Berhasil menyimpan data gempa',
      data: earthquakeEvaporation,
    };
  }

  /**
   * Mengubah data gempa dan mencatat ke activity log
   */
  async updateEarthquake(
    dto: EditEarthquakeDto,
    ipAddress: string,
    userAgent: string,
  ) {
    const {
      id,
      user_id,
      date,
      time,
      mmi,
      description,
      depth,
      latitude,
      longitude,
      magnitude,
      observer_name,
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

    // 2. Update data gempa berdasarkan id
    const { data: updatedEarthquake, error: earthquakeError } =
      await this.supabase
        .from('earthquake')
        .update({
          date,
          time,
          mmi,
          description,
          depth,
          latitude,
          longitude,
          magnitude,
          observer_name,
        })
        .eq('id', id)
        .select();

    if (earthquakeError || !updatedEarthquake) {
      return {
        success: false,
        message: 'Gagal mengubah data gempa',
        error: earthquakeError ? earthquakeError.message : 'Unknown error',
      };
    }

    // 3. Mencatat ke activity log
    const createdAt = new Date().toLocaleString('en-US', {
      timeZone: 'Asia/Jakarta',
    });

    await this.activityLogService.logActivity({
      admin_id: user_id,
      action: 'Mengubah Data Gempa',
      description: `${namaAdmin} mengubah data gempa dengan tingkat intensitas ${mmi}, terdeteksi pada koordinat (${latitude}, ${longitude}), dengan kedalaman ${depth} km.`,
      ip_address: ipAddress,
      user_agent: userAgent,
      created_at: createdAt,
    });

    return {
      success: true,
      message: 'Berhasil mengubah data gempa',
      data: updatedEarthquake,
    };
  }

  /**
   * Menghapus data gempa dan mencatat ke activity log
   */
  async deleteEarthquake(
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

    // 2. Ambil data gempa (untuk log)
    const { data: earthquakeData, error: getEarthquakeError } =
      await this.supabase.from('earthquake').select('*').eq('id', id).single();

    if (getEarthquakeError || !earthquakeData) {
      return {
        success: false,
        message: 'Data gempa tidak ditemukan',
        error: getEarthquakeError
          ? getEarthquakeError.message
          : 'Unknown error',
      };
    }

    const { mmi, depth, latitude, longitude } = earthquakeData;

    // 3. Hapus gempa hujan berdasarkan id
    const { error: deleteEarthquakeError } = await this.supabase
      .from('earthquake')
      .delete()
      .eq('id', id);

    if (deleteEarthquakeError) {
      return {
        success: false,
        message: 'Gagal menghapus data gempa',
        error: deleteEarthquakeError.message,
      };
    }

    // 4. Mencatat ke activity log
    const createdAt = new Date().toLocaleString('en-US', {
      timeZone: 'Asia/Jakarta',
    });

    await this.activityLogService.logActivity({
      admin_id: user_id,
      action: 'Menghapus Data Gempa',
      description: `${namaAdmin} menghapus data gempa dengan tingkat intensitas ${mmi}, terdeteksi pada koordinat (${latitude}, ${longitude}), dengan kedalaman ${depth} km.`,
      ip_address: ipAddress,
      user_agent: userAgent,
      created_at: createdAt,
    });

    return {
      success: true,
      message: 'Berhasil menghapus data gempa',
      data: earthquakeData,
    };
  }

  /**
   * Mengambil semua data gempa
   */
  async getAllEarthquake() {
    const { data, error } = await this.supabase.from('earthquake').select('*');

    if (error || !data) {
      return {
        success: false,
        message: 'Gagal mengambil data gempa',
        error,
      };
    }

    return {
      success: true,
      message: 'Berhasil mengambil semua data gempa',
      data: data,
    };
  }

  /**
   * Mengambil semua data gempa berdasarkan id
   */
  async getEarthquakeById(id: number) {
    const { data, error } = await this.supabase
      .from('earthquake')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return {
        success: false,
        message: 'Gagal mengambil data gempa berdasarkan id',
        error,
      };
    }

    return {
      success: true,
      message: 'Berhasil mengambil data gempa berdasarkan id',
      data,
    };
  }

  /**
   * Mengambil data gempa berdasarkan rentang tanggal
   */
  async getEarthquakeByDate(dto: FilterEarthquakeByDateDto) {
    const { start_date, end_date } = dto;

    const { data, error } = await this.supabase
      .from('earthquake')
      .select('*')
      .gte('date', start_date)
      .lte('date', end_date);

    if (error || !data) {
      return {
        success: false,
        message: 'Gagal mengambil data gempa berdasarkan rentang tanggal',
        error,
      };
    }

    return {
      success: true,
      message: 'Berhasil mengambil data gempa berdasarkan rentang tanggal',
      data,
    };
  }
}
