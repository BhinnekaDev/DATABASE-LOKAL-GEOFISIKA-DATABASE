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
    const regexWithoutMMI =
      /Mag:([\d.]+),\s(\d{2}-[a-zA-Z]{3}-\d{2})\s(\d{2}:\d{2}:\d{2})\sWIB,\sLok:([\d.]+)\sLS\s-\s([\d.]+)\sBT\s\((\d+)\skm\s([^)]+)\),\sKedlmn:\s(\d+)\s?[Kk][Mm]\s::(.+)/;

    const regexWithMMI =
      /Mag:([\d.]+),\s(\d{2}-[a-zA-Z]{3}-\d{2})\s(\d{2}:\d{2}:\d{2})\sWIB,\sLok:([\d.]+)\sLS\s-\s([\d.]+)\sBT\s\((\d+)\skm\s([^)]+)\),\sKedlmn:\s(\d+)\s?[Kk][Mm],\sdirasakan\sDi\s(.+?)\s::(.+)/;

    let matches: RegExpMatchArray | null;
    let hasMMI = false;

    matches = input.match(regexWithMMI);
    if (matches) {
      hasMMI = true;
    } else {
      matches = input.match(regexWithoutMMI);
    }

    if (!matches) {
      throw new Error('Format input tidak valid');
    }

    const magnitude = parseFloat(matches[1]);
    const dateStr = matches[2];
    const timeStr = matches[3];
    const date_time = this.combineDateTime(dateStr, timeStr);

    const latitude = -Math.abs(parseFloat(matches[4].replace(',', '.')));
    const longitude = parseFloat(matches[5].replace(',', '.'));
    const depth = parseInt(matches[8], 10);
    const location = matches[7].trim();

    const mmi = hasMMI ? matches[9].trim() : null;
    const observerName = hasMMI ? matches[10].trim() : matches[9].trim();

    return {
      magnitude,
      date_time,
      latitude,
      longitude,
      depth,
      description: location,
      mmi,
      observerName,
    };
  }

  /**
   * Menggabungkan tanggal dan waktu menjadi objek Date dengan zona waktu WIB (GMT+7)
   */
  private combineDateTime(dateStr: string, timeStr: string): Date {
    const [day, monthStr, year] = dateStr.split('-');
    const months: Record<string, string> = {
      jan: '01',
      feb: '02',
      mar: '03',
      apr: '04',
      mei: '05',
      jun: '06',
      jul: '07',
      agu: '08',
      sep: '09',
      okt: '10',
      nov: '11',
      des: '12',
    };

    const month = months[monthStr.toLowerCase()];
    if (!month) throw new Error('Bulan tidak valid');

    const fullYear = 2000 + parseInt(year, 10); // Tahun 25 jadi 2025

    // Format ISO lengkap + zona waktu WIB
    const isoString = `${fullYear}-${month}-${day.padStart(2, '0')}T${timeStr}+07:00`;
    return new Date(isoString);
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
      date_time,
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
          date_time,
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
      date_time,
      latitude,
      longitude,
      depth,
      description,
      mmi,
      observerName,
    } = this.parseEarthquakeInput(input);

    // 3. Simpan data gempa
    const { data: insertedEarthquake, error: earthquakeError } =
      await this.supabase
        .from('earthquake')
        .insert({
          date_time,
          magnitude,
          description,
          depth,
          latitude,
          longitude,
          mmi,
          observer_name: observerName,
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
   * Menggabungkan tanggal dan waktu menjadi objek Date untk inser excel
   */
  private gabungTanggalWaktu(
    tanggal: Date | string,
    waktu: Date | string,
  ): Date | null {
    try {
      const tgl = new Date(tanggal);
      let jam = 0,
        menit = 0,
        detik = 0;

      // Jika waktu berupa string seperti '08:15:00'
      if (typeof waktu === 'string') {
        const [j, m, d] = waktu.split(':').map((v) => parseInt(v, 10));
        if ([j, m, d].some((v) => isNaN(v))) return null;
        jam = j;
        menit = m;
        detik = d;
      }

      // Jika waktu berupa Date dari Excel (misalnya 1899-12-30T08:15:00.000Z)
      else if (waktu instanceof Date) {
        jam = waktu.getUTCHours();
        menit = waktu.getUTCMinutes();
        detik = waktu.getUTCSeconds();
      }

      tgl.setHours(jam);
      tgl.setMinutes(menit);
      tgl.setSeconds(detik);
      return tgl;
    } catch (e) {
      return null;
    }
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
        // Cek jika ini adalah baris header
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

        const dateTime = this.gabungTanggalWaktu(formattedDate, time);
        if (!dateTime) {
          console.error(
            'Gagal menggabungkan tanggal dan waktu untuk data:',
            row,
          );
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
          date_time: dateTime,
          mmi,
          description,
          depth,
          latitude,
          longitude,
          magnitude,
          observer_name: observerName,
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
      date_time,
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
          date_time,
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
   * Mengambil data gempa berdasarkan rentang tanggal, magnitude, dan kedalaman
   */
  async getEarthquakeByAllData(dto: FilterEarthquakeByDateDto) {
    const {
      start_date,
      end_date,
      min_magnitude,
      max_magnitude,
      min_depth,
      max_depth,
      min_lat,
      max_lat,
      min_long,
      max_long,
      min_mmi,
      max_mmi,
    } = dto;

    let query = this.supabase.from('earthquake').select('*');

    if (start_date) {
      query = query.gte('date_time', `${start_date}T00:00:00`);
    }

    if (end_date) {
      query = query.lte('date_time', `${end_date}T23:59:59`);
    }

    if (min_magnitude) {
      query = query.gte('magnitude', parseFloat(min_magnitude));
    }

    if (max_magnitude) {
      query = query.lte('magnitude', parseFloat(max_magnitude));
    }

    if (min_depth) {
      query = query.gte('depth', parseFloat(min_depth));
    }

    if (max_depth) {
      query = query.lte('depth', parseFloat(max_depth));
    }

    if (min_lat && max_lat && min_long && max_long) {
      query = query
        .gte('latitude', parseFloat(min_lat))
        .lte('latitude', parseFloat(max_lat))
        .gte('longitude', parseFloat(min_long))
        .lte('longitude', parseFloat(max_long));
    }

    const { data, error } = await query;

    if (error || !data) {
      return {
        success: false,
        message:
          'Gagal mengambil data gempa berdasarkan filter tanggal, magnitude, dan kedalaman',
        error,
      };
    }

    // Tambahan: Konversi Romawi ke angka untuk filter MMI
    const romanToInt = (roman: string): number => {
      const map: { [key: string]: number } = {
        I: 1,
        II: 2,
        III: 3,
        IV: 4,
        V: 5,
        VI: 6,
        VII: 7,
        VIII: 8,
        IX: 9,
        X: 10,
        XI: 11,
        XII: 12,
      };
      return map[roman?.toUpperCase()] ?? 0;
    };

    let filteredData = data;

    if (min_mmi || max_mmi) {
      const minMMIInt = min_mmi ? romanToInt(min_mmi) : null;
      const maxMMIInt = max_mmi ? romanToInt(max_mmi) : null;

      if ((min_mmi && minMMIInt === null) || (max_mmi && maxMMIInt === null)) {
        filteredData = [];
      } else {
        filteredData = data.filter((item) => {
          if (!item.mmi) return false;
          const mmiInt = romanToInt(item.mmi);
          return (
            (minMMIInt === null || mmiInt >= minMMIInt) &&
            (maxMMIInt === null || mmiInt <= maxMMIInt)
          );
        });
      }
    }

    return {
      success: true,
      message:
        'Berhasil mengambil data gempa berdasarkan filter tanggal, magnitude, dan kedalaman',
      data: filteredData,
    };
  }
}
