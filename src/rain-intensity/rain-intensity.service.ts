import { Buffer } from 'buffer';
import * as dotenv from 'dotenv';
import * as ExcelJS from 'exceljs';
import { v4 as uuidv4 } from 'uuid';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

import { ActivityLogService } from '@/activity-log/activity-log.service';
import { EditRainIntensityDto } from '@/rain-intensity/dto/edit-rain-intensity.dto';
import { CreateRainIntensityDto } from '@/rain-intensity/dto/create-rain-intensity.dto';
import { RainIntensityDataExcel } from '@/rain-intensity/interfaces/RainIntensityDataExcel';
import { FilterRainIntensityByDateDto } from '@/rain-intensity/dto/filterRainIntensityByDateDto';
import { CreateRainIntensityExcelDto } from '@/rain-intensity/dto/create-rain-intensity-excel.dto';

dotenv.config();

@Injectable()
export class RainIntensityService {
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
  ): RainIntensityDataExcel[] {
    const worksheet = workbook.worksheets[0];
    return worksheet
      .getSheetValues()
      .slice(1)
      .filter((row) => row !== null && row !== undefined)
      .map((row) => ({
        nama: row[1],
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

  async saveRainIntensity(
    dto: CreateRainIntensityDto,
    ipAddress: string,
    userAgent: string,
  ) {
    const { user_id, date, name, file_base64 } = dto;

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

    // 2. Normalisasi prefix base64
    let fixedBase64 = file_base64;

    // Jika prefix tidak valid, perbaiki ke format yang benar
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
    const bucketName = 'rain-intensity';

    // Unggah ke Supabase Storage
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

    // Ambil public URL file yang baru diupload
    const { data: publicUrlData } = this.supabase.storage
      .from(bucketName)
      .getPublicUrl(fileName);

    // Simpan data ke tabel rain_intensity
    const { data: insertedRainIntensity, error: rainIntensityError } =
      await this.supabase
        .from('rain_intensity')
        .insert({
          date,
          name,
          file_url: publicUrlData.publicUrl,
        })
        .select();

    if (rainIntensityError || !insertedRainIntensity) {
      return {
        success: false,
        message: 'Gagal menyimpan data intensitas hujan',
        error: rainIntensityError,
      };
    }

    // 3. Catat ke activity log
    const createdAt = new Date().toLocaleString('en-US', {
      timeZone: 'Asia/Jakarta',
    });

    await this.activityLogService.logActivity({
      admin_id: user_id,
      action: 'Menambahkan Data Intensitas Hujan',
      description: `${namaAdmin} menambahkan data intensitas hujan dengan nama ${name} untuk tanggal ${date}.`,
      ip_address: ipAddress,
      user_agent: userAgent,
      created_at: createdAt,
    });

    return {
      success: true,
      message: 'Berhasil menyimpan data intensitas hujan',
      data: insertedRainIntensity,
    };
  }

  /**
   * Menyimpan data excel intensitas hujan dan mencatat ke activity log
   */
  async saveExcelRainIntensity(
    dto: CreateRainIntensityExcelDto,
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
          row['nama']?.toString().toLowerCase() === 'nama'
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

        const rainIntensity = row['nama'];
        if (!rainIntensity) {
          console.error('Nama tidak valid untuk data:', row);
          return null;
        }

        return {
          name: rainIntensity,
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

    // 5. Simpan data instensitas hujan ke dalam tabel 'rain_intensity'
    const { data: insertedRainIntensity, error: rainIntensityError } =
      await this.supabase
        .from('rain_intensity')
        .insert(dataWithFormattedDate)
        .select();

    if (
      rainIntensityError ||
      !insertedRainIntensity ||
      insertedRainIntensity.length === 0
    ) {
      return {
        success: false,
        message: 'Gagal menyimpan data intensitas hujan',
        error: rainIntensityError,
      };
    }

    // 6. Mencatat ke activity log
    const createdAt = new Date().toLocaleString('en-US', {
      timeZone: 'Asia/Jakarta',
    });

    await this.activityLogService.logActivity({
      admin_id: user_id,
      action: 'Menambahkan Data Intensitas Hujan',
      description: `${namaAdmin} menambahkan data intensitas hujan dengan mengunggah file excel.`,
      ip_address: ipAddress,
      user_agent: userAgent,
      created_at: createdAt,
    });

    return {
      success: true,
      message: 'Berhasil menyimpan data intensitas hujan',
      data: insertedRainIntensity,
    };
  }

  /**
   * Mengubah data temperatur minimal dan mencatat ke activity log
   */
  async updateRainIntensity(
    dto: EditRainIntensityDto,
    ipAddress: string,
    userAgent: string,
  ) {
    const { id, user_id, date, name, file_base64 } = dto;

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

    // Ambil data intensitas hujan
    const { data: rainIntensityData, error: rainIntensityFetchError } =
      await this.supabase
        .from('rain_intensity')
        .select('*')
        .eq('id', id)
        .maybeSingle();

    if (rainIntensityFetchError || !rainIntensityData) {
      return {
        success: false,
        message: 'Data intensitas hujan tidak ditemukan',
        error: rainIntensityFetchError,
      };
    }

    const bucketName = 'rain-intensity';
    let newFileUrl = rainIntensityData.file_url;

    // 3. Jika terdapat file baru, hapus file lama dan upload file baru
    if (file_base64) {
      // Jika file_url sudah ada, hapus file lama dari storage
      if (rainIntensityData.file_url) {
        const parts = rainIntensityData.file_url.split('/');
        const oldFileName = parts[parts.length - 1];

        await this.supabase.storage.from(bucketName).remove([oldFileName]);
      }

      // 🔧 Perbaiki jika format base64 tidak standar
      let fixedBase64 = file_base64;
      if (fixedBase64.startsWith('data:@file/jpeg;base64,')) {
        fixedBase64 = fixedBase64.replace(
          'data:@file/jpeg;base64,',
          'data:image/jpeg;base64,',
        );
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

    // 2. Update data intensitas hujan berdasarkan id
    const { data: updatedRainIntensity, error: rainIntensityError } =
      await this.supabase
        .from('rain_intensity')
        .update({ name, date, file_url: newFileUrl })
        .eq('id', id)
        .select();

    if (rainIntensityError || !updatedRainIntensity) {
      return {
        success: false,
        message: 'Gagal mengubah data intensitas hujan',
        error: rainIntensityError,
      };
    }

    // 3. Mencatat ke activity log
    const createdAt = new Date().toLocaleString('en-US', {
      timeZone: 'Asia/Jakarta',
    });

    await this.activityLogService.logActivity({
      admin_id: user_id,
      action: 'Mengubah Data Intensitas Hujan',
      description: `${namaAdmin} mengubah data intensitas hujan dengan nama ${name} untuk tanggal ${date}.`,
      ip_address: ipAddress,
      user_agent: userAgent,
      created_at: createdAt,
    });

    return {
      success: true,
      message: 'Berhasil mengubah data intensitas hujan',
      data: updatedRainIntensity,
    };
  }

  /**
   * Menghapus data intensitas hujan dan mencatat ke activity log
   */
  async deleteRainIntensity(
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

    // 2. Ambil data intensitas hujan (untuk log)
    const { data: rainIntensityData, error: rainIntensityError } =
      await this.supabase
        .from('rain_intensity')
        .select(`*`)
        .eq('id', id)
        .single();

    if (rainIntensityError || !rainIntensityData) {
      return {
        success: false,
        message: 'Data intensitas hujan tidak ditemukan',
        error: rainIntensityError,
      };
    }

    const { name, date } = rainIntensityData;

    const bucketName = 'rain-intensity';

    // 3. Hapus file dari storage jika ada file_url
    if (rainIntensityData.file_url) {
      const parts = rainIntensityData.file_url.split('/');
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

    // 3. Hapus data intensitas hujan berdasarkan id
    const { error: deleteRainIntensityError } = await this.supabase
      .from('rain_intensity')
      .delete()
      .eq('id', id);

    if (deleteRainIntensityError) {
      return {
        success: false,
        message: 'Gagal menghapus data intensitas hujan',
        error: deleteRainIntensityError,
      };
    }

    // 4. Mencatat ke activity log
    const createdAt = new Date().toLocaleString('en-US', {
      timeZone: 'Asia/Jakarta',
    });

    await this.activityLogService.logActivity({
      admin_id: user_id,
      action: 'Menghapus Data Intensitas Hujan',
      description: `${namaAdmin} menghapus data intensitas hujan dengan nama ${name} untuk tanggal ${date}.`,
      ip_address: ipAddress,
      user_agent: userAgent,
      created_at: createdAt,
    });

    return {
      success: true,
      message: 'Berhasil menghapus data intensitas hujan',
      data: rainIntensityData,
    };
  }

  /**
   * Mengambil semua data intensitas hujan
   */
  async getAllRainIntensity() {
    const { data, error } = await this.supabase
      .from('rain_intensity')
      .select('*');

    if (error || !data) {
      return {
        success: false,
        message: 'Gagal mengambil data intensitas hujan',
        error,
      };
    }

    return {
      success: true,
      message: 'Berhasil mengambil semua data intensitas hujan',
      data: data,
    };
  }

  /**
   * Mengambil semua data intensitas hujan berdasarkan id
   */
  async getRainIntensityById(id: number) {
    const { data, error } = await this.supabase
      .from('rain_intensity')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return {
        success: false,
        message: 'Gagal mengambil data intensitas hujan berdasarkan id',
        error,
      };
    }

    return {
      success: true,
      message: 'Berhasil mengambil data intensitas hujan berdasarkan id',
      data,
    };
  }

  /**
   * Mengambil data intensitas hujan berdasarkan rentang tanggal
   */
  async getRainIntensityByDate(dto: FilterRainIntensityByDateDto) {
    const { start_date, end_date } = dto;

    const { data, error } = await this.supabase
      .from('rain_intensity')
      .select('*')
      .gte('date', start_date)
      .lte('date', end_date);

    if (error || !data) {
      return {
        success: false,
        message:
          'Gagal mengambil data intensitas hujan berdasarkan rentang tanggal',
        error,
      };
    }

    return {
      success: true,
      message:
        'Berhasil mengambil data intensitas hujan berdasarkan rentang tanggal',
      data,
    };
  }
}
