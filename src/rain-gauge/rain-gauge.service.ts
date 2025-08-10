import { Buffer } from 'buffer';
import * as dotenv from 'dotenv';
import * as ExcelJS from 'exceljs';
import { v4 as uuidv4 } from 'uuid';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

import { EditRainGaugeDto } from '@/rain-gauge/dto/edit-rain-gauge.dto';
import { ActivityLogService } from '@/activity-log/activity-log.service';
import { FilterRainGaugeDto } from '@/rain-gauge/dto/filter-rain-gauge.dto';
import { CreateRainGaugeDto } from '@/rain-gauge/dto/create-rain-gauge.dto';
import { GetRainGaugeQueryDto } from '@/rain-gauge/dto/getRainGaugeQueryDto';
import { RainGaugeDataExcel } from '@/rain-gauge/interfaces/rainGaugeDataExcel';
import { EditRainGaugeQueryDto } from '@/rain-gauge/dto/edit-rain-gauge-query.dto';
import { FilterRainGaugeByDateDto } from '@/rain-gauge/dto/filterRainGaugeByDateDto';
import { CreateRainGaugeQueryDto } from '@/rain-gauge/dto/create-rain-gauge-query.dto';
import { CreateRainGaugeExcelDto } from '@/rain-gauge/dto/create-rain-gauge-excel.dto';
import { CreateRainGaugeQueryExcelDto } from '@/rain-gauge/dto/create-rain-gauge-query-excel-dto';

dotenv.config();

@Injectable()
export class RainGaugeService {
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
   * Menyimpan data pos hujan
   */

  async saveRainGauge(
    dto: CreateRainGaugeDto,
    dtoQuery: CreateRainGaugeQueryDto,
    ipAddress: string,
    userAgent: string,
  ) {
    const { date, name, file_base64 } = dto;
    const { user_id, city, village } = dtoQuery;

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

    if (!file_base64 || typeof file_base64 !== 'string') {
      return {
        success: false,
        message: 'Data file_base64 tidak ditemukan atau tidak valid',
        error: 'Missing or invalid file_base64',
      };
    }
    // 2. Normalisasi prefix base64
    let fixedBase64 = file_base64;

    if (fixedBase64.startsWith('data:@file/jpeg;base64,')) {
      fixedBase64 = fixedBase64.replace(
        'data:@file/jpeg;base64,',
        'data:image/jpeg;base64,',
      );
    } else if (!fixedBase64.startsWith('data:image/jpeg;base64,')) {
      return {
        success: false,
        message: 'Format base64 tidak dikenali atau tidak valid',
        error: 'Invalid base64 prefix',
      };
    }

    // Strip prefix base64 dan konversi ke buffer
    const base64Data = fixedBase64.replace(/^data:image\/\w+;base64,/, '');
    const fileBuffer = Buffer.from(base64Data, 'base64');

    // Nama file unik
    const fileName = `${uuidv4()}.jpg`;
    const bucketName = 'rain-gauge';

    // 3. Unggah ke Supabase Storage
    const { error: uploadError } = await this.supabase.storage
      .from(bucketName)
      .upload(fileName, fileBuffer, {
        contentType: 'image/jpeg',
        upsert: false,
      });

    if (uploadError) {
      return {
        success: false,
        message: 'Gagal mengunggah file ke Storage Supabase',
        error: uploadError,
      };
    }

    // 4. Ambil public URL file
    const { data: publicUrlData } = this.supabase.storage
      .from(bucketName)
      .getPublicUrl(fileName);

    // 5. Simpan data pos hujan ke database
    const { data: rainGaugeInserted, error: insertError } = await this.supabase
      .from('rain_gauge')
      .insert({
        name,
        date,
        city,
        village,
        file_url: publicUrlData.publicUrl,
      })
      .select()
      .single();

    if (insertError) {
      return {
        success: false,
        message: 'Gagal menyimpan data pos hujan',
        error: insertError,
      };
    }

    // 6. Catat aktivitas ke activity log
    const createdAt = new Date().toLocaleString('en-US', {
      timeZone: 'Asia/Jakarta',
    });

    await this.activityLogService.logActivity({
      admin_id: user_id,
      action: 'Menambahkan Data Pos Hujan',
      description: `${namaAdmin} menambahkan pos hujan dengan nama ${name} untuk tanggal ${date}.`,
      ip_address: ipAddress,
      user_agent: userAgent,
      created_at: createdAt,
    });

    return {
      success: true,
      message: 'Berhasil menyimpan data pos hujan dan mengunggah gambar',
      data: rainGaugeInserted,
    };
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
  private parseExcelToData(workbook: ExcelJS.Workbook): RainGaugeDataExcel[] {
    const worksheet = workbook.worksheets[0];
    const data: RainGaugeDataExcel[] = [];

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;

      const tanggal = row.getCell(2).value?.toString() ?? null;
      const nama = row.getCell(1).value?.toString() ?? null;

      data.push({
        tanggal,
        nama,
      });
    });

    return data;
  }

  /**
   * Menyimpan data excel pos hujan dan mencatat ke activity log
   */
  async saveExcelRainGauge(
    dto: CreateRainGaugeExcelDto,
    dtoQuery: CreateRainGaugeQueryExcelDto,
    ipAddress: string,
    userAgent: string,
  ) {
    const { file_base64 } = dto;
    const { user_id, city, village } = dtoQuery;

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

    // 3. Parse Excel menjadi array objek
    const data = this.parseExcelToData(workbook);
    if (data.length === 0) {
      return {
        success: false,
        message: 'Data Excel kosong atau tidak valid',
      };
    }

    // 4. Format tanggal dan siapkan data untuk disimpan
    const dataWithFormattedDate = data
      .map((row) => {
        if (row.tanggal?.toLowerCase() === 'tanggal') return null;
        if (!row.tanggal) {
          console.error('Tanggal tidak ditemukan untuk data:', row);
          return null;
        }

        const formattedDate = this.formatDateToPostgres(row.tanggal);
        if (!formattedDate) {
          console.error('Tanggal tidak valid:', row.tanggal);
          return null;
        }

        return {
          date: formattedDate,
          name: row.nama ?? null,
          city,
          village,
          file_url: '',
        };
      })
      .filter((row) => row !== null);

    if (dataWithFormattedDate.length === 0) {
      return {
        success: false,
        message: 'Tidak ada data valid untuk disimpan',
      };
    }

    // 5. Simpan ke tabel 'rain_gauge'
    const { data: insertedRainGauge, error: rainGaugeError } =
      await this.supabase
        .from('rain_gauge')
        .insert(dataWithFormattedDate)
        .select();

    if (
      rainGaugeError ||
      !insertedRainGauge ||
      insertedRainGauge.length === 0
    ) {
      return {
        success: false,
        message: 'Gagal menyimpan data pos hujan',
        error: rainGaugeError,
      };
    }

    // 6. Catat aktivitas admin
    const createdAt = new Date().toLocaleString('en-US', {
      timeZone: 'Asia/Jakarta',
    });

    await this.activityLogService.logActivity({
      admin_id: user_id,
      action: 'Menambahkan Data Pos Hujan',
      description: `${namaAdmin} menambahkan data pos hujan dengan mengunggah file excel.`,
      ip_address: ipAddress,
      user_agent: userAgent,
      created_at: createdAt,
    });

    return {
      success: true,
      message: 'Berhasil menyimpan data pos hujan',
      data: insertedRainGauge,
    };
  }

  /**
   * Ambil semua data pos hujan sesuai filter
   */
  async findAll(filter: FilterRainGaugeDto) {
    let query = this.supabase.from('rain_gauge').select('*');

    if (filter.city) {
      query = query.eq('city', filter.city);
    }

    if (filter.village) {
      query = query.eq('village', filter.village);
    }

    const { data, error } = await query;

    if (error) throw new Error(error.message);

    return data;
  }

  /**
   * Mengubah data pos hujan, mengupload file baru (jika ada) serta menghapus file lama di Supabase Storage
   * dan mencatat ke activity log.
   */
  async updateRainGauge(
    dto: EditRainGaugeDto,
    dtoQuery: EditRainGaugeQueryDto,
    ipAddress: string,
    userAgent: string,
  ) {
    const { id, user_id } = dtoQuery;
    const { name, date, file_base64 } = dto;

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

    // 2. Ambil data pos hujan saat ini
    const { data: rainGaugeData, error: rainGaugeError } = await this.supabase
      .from('rain_gauge')
      .select('*')
      .eq('id', id)
      .single();

    if (rainGaugeError || !rainGaugeData) {
      return {
        success: false,
        message: 'Data pos hujan tidak ditemukan',
        error: rainGaugeError,
      };
    }

    const bucketName = 'rain-gauge';
    let newFileUrl = rainGaugeData.file_url;

    if (file_base64 && typeof file_base64 === 'string') {
      let fixedBase64 = file_base64;

      if (fixedBase64.startsWith('data:@file/jpeg;base64,')) {
        fixedBase64 = fixedBase64.replace(
          'data:@file/jpeg;base64,',
          'data:image/jpeg;base64,',
        );
      } else if (!fixedBase64.startsWith('data:image/jpeg;base64,')) {
        return {
          success: false,
          message: 'Format base64 tidak dikenali atau tidak valid',
          error: 'Invalid base64 prefix',
        };
      }

      // Jika file_url sudah ada, hapus file lama dari storage
      if (rainGaugeData.file_url) {
        const parts = rainGaugeData.file_url.split('/');
        const oldFileName = parts[parts.length - 1];
        await this.supabase.storage.from(bucketName).remove([oldFileName]);
      }

      // Upload file baru
      const newFileName = `${uuidv4()}.jpg`;
      const base64Data = fixedBase64.replace(/^data:image\/\w+;base64,/, '');
      const fileBuffer = Buffer.from(base64Data, 'base64');

      const { error: uploadError } = await this.supabase.storage
        .from(bucketName)
        .upload(newFileName, fileBuffer, {
          contentType: 'image/jpeg',
          upsert: false,
        });

      if (uploadError) {
        return {
          success: false,
          message: 'Gagal mengunggah file ke Storage Supabase',
          error: uploadError,
        };
      }

      // Ambil URL publik dari file yang baru diunggah
      const { data: publicUrlData } = this.supabase.storage
        .from(bucketName)
        .getPublicUrl(newFileName);

      newFileUrl = publicUrlData.publicUrl;
    }

    // 4. Update data pos hujan berdasarkan id
    const { data: updatedRecord, error: updateError } = await this.supabase
      .from('rain_gauge')
      .update({
        name,
        date,
        file_url: newFileUrl,
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      return {
        success: false,
        message: 'Gagal mengubah data pos hujan',
        error: updateError,
      };
    }

    // 5. Mencatat ke activity log
    const createdAt = new Date().toLocaleString('en-US', {
      timeZone: 'Asia/Jakarta',
    });

    await this.activityLogService.logActivity({
      admin_id: user_id,
      action: 'Mengubah Data Pos Hujan',
      description: `${namaAdmin} mengubah data pos hujan dengan nama ${name} untuk tanggal ${date}.`,
      ip_address: ipAddress,
      user_agent: userAgent,
      created_at: createdAt,
    });

    return {
      success: true,
      message:
        'Berhasil mengubah data pos hujan dan mengupdate file pada storage',
      data: updatedRecord,
    };
  }

  /**
   * Menghapus data tanda waktu, hapus file baru (jika ada) di Supabase Storage
   * dan mencatat ke activity log.
   */
  async deleteRainGauge(
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

    // 2. Ambil data tanda waktu untuk mendapatkan file_url
    const { data: rainGaugeData, error: getDataError } = await this.supabase
      .from('rain_gauge')
      .select('*')
      .eq('id', id)
      .single();

    if (getDataError || !rainGaugeData) {
      return {
        success: false,
        message: 'Data pos hujan tidak ditemukan',
        error: getDataError,
      };
    }

    const { name, date } = rainGaugeData;

    const bucketName = 'rain-gauge';

    // 3. Hapus file dari storage jika ada file_url
    if (rainGaugeData.file_url) {
      const parts = rainGaugeData.file_url.split('/');
      const fileName = parts[parts.length - 1];

      const { error: deleteFileError } = await this.supabase.storage
        .from(bucketName)
        .remove([fileName]);

      if (deleteFileError) {
        return {
          success: false,
          message: 'Gagal menghapus file dari Storage Supabase',
          error: deleteFileError,
        };
      }
    }

    // 4. Hapus data dari tabel tanda waktu
    const { data: deletedData, error: deleteError } = await this.supabase
      .from('rain_gauge')
      .delete()
      .eq('id', id)
      .select()
      .single();

    if (deleteError) {
      return {
        success: false,
        message: 'Gagal menghapus data pos hujan dari database',
        error: deleteError,
      };
    }

    // 5. Catat aktivitas penghapusan
    const createdAt = new Date().toLocaleString('en-US', {
      timeZone: 'Asia/Jakarta',
    });

    await this.activityLogService.logActivity({
      admin_id: user_id,
      action: 'Menghapus Data Pos Hujan',
      description: `${namaAdmin} menghapus data pos hujan dengan nama ${name} untuk tanggal ${date}.`,
      ip_address: ipAddress,
      user_agent: userAgent,
      created_at: createdAt,
    });

    return {
      success: true,
      message: 'Berhasil menghapus data pos hujan dan file terkait',
      data: deletedData,
    };
  }

  /**
   * Mengambil data pos hujan berdasarkan ID, kota, dan desa (jika tersedia)
   */
  async getRainGaugeById(dto: GetRainGaugeQueryDto) {
    const { id, city, village } = dto;

    let query = this.supabase.from('rain_gauge').select('*');

    if (id !== undefined) {
      query = query.eq('id', id);
    }

    if (city) {
      query = query.eq('city', city);
    }

    if (village) {
      query = query.eq('village', village);
    }

    // Jika hanya filter ID, ambil .single(); jika tidak, jangan pakai .single()
    const { data, error } =
      id && !city && !village ? await query.single() : await query;

    if (error || !data) {
      return {
        success: false,
        message:
          'Gagal mengambil data pos hujan berdasarkan filter yang diberikan',
        error,
      };
    }

    return {
      success: true,
      message:
        'Berhasil mengambil data pos hujan berdasarkan filter yang diberikan',
      data,
    };
  }

  /**
   * Mengambil data pos hujan berdasarkan rentang tanggal
   */
  async getRainGaugeByDate(dto: FilterRainGaugeByDateDto) {
    const { start_date, end_date, city, village } = dto;

    let query = this.supabase.from('rain_gauge').select('*');

    if (start_date) {
      query = query.gte('date', start_date);
    }
    if (end_date) {
      query = query.lte('date', end_date);
    }
    if (city) {
      query = query.eq('city', city);
    }
    if (village) {
      query = query.eq('village', village);
    }

    const { data, error } = await query;

    if (error || !data) {
      return {
        success: false,
        message:
          'Gagal mengambil data pos hujan berdasarkan filter yang diberikan',
        error,
      };
    }

    return {
      success: true,
      message:
        'Berhasil mengambil data pos hujan berdasarkan filter yang diberikan',
      data,
    };
  }

  /**
   * Mengambil data pos hujan berdasarkan kota dan/atau desa
   */
  async getRainGaugeByCityVillage(dto: FilterRainGaugeDto) {
    let query = this.supabase.from('rain_gauge').select('*');

    if (dto.city) {
      query = query.eq('city', dto.city);
    }

    if (dto.village) {
      query = query.eq('village', dto.village);
    }

    const { data, error } = await query;

    if (error || !data) {
      return {
        success: false,
        message: 'Gagal mengambil data pos hujan berdasarkan kota/desa',
        error,
      };
    }

    return {
      success: true,
      message: 'Berhasil mengambil data pos hujan berdasarkan kota/desa',
      data,
    };
  }
}
