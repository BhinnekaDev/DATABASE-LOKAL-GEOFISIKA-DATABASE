import { Buffer } from 'buffer';
import * as dotenv from 'dotenv';
import * as ExcelJS from 'exceljs';
import { v4 as uuidv4 } from 'uuid';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

import { ActivityLogService } from '@/activity-log/activity-log.service';
import { EditTimeSignatureDto } from '@/time-signature/dto/edit-time-signature.dto';
import { CreateTimeSignatureDto } from '@/time-signature/dto/create-time-signature.dto';
import { TimeSignatureDataExcel } from '@/time-signature/interfaces/TimeSignatureDataExcel';
import { FilterTimeSignatureByDateDto } from '@/time-signature/dto/filterTimeSignatureByDateDto';
import { CreateTimeSignatureExcelDto } from '@/time-signature/dto/create-time-signature-excel.dto';

dotenv.config();
@Injectable()
export class TimeSignatureService {
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
  ): TimeSignatureDataExcel[] {
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

  /**
   * Menyimpan data tanda waktu dan mencatat ke activity log
   */
  async saveTimeSignature(
    dto: CreateTimeSignatureDto,
    ipAddress: string,
    userAgent: string,
  ) {
    const { user_id, name, date, file_base64 } = dto;

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

    // 2. Unggah ke Supabase Storage
    const fileName = `${uuidv4()}.jpg`;
    const bucketName = 'time-signatures';

    // 🔧 Perbaiki format base64 jika tidak standar
    let fixedBase64 = file_base64;
    if (fixedBase64.startsWith('data:@file/jpeg;base64,')) {
      fixedBase64 = fixedBase64.replace(
        'data:@file/jpeg;base64,',
        'data:image/jpeg;base64,',
      );
    }

    // Convert base64 ke Buffer
    const base64Data = fixedBase64.replace(/^data:image\/\w+;base64,/, '');
    const fileBuffer = Buffer.from(base64Data, 'base64');

    // Unggah ke Supabase
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

    // 3. Ambil URL publik dari file yang diunggah
    const { data: publicUrlData } = this.supabase.storage
      .from(bucketName)
      .getPublicUrl(fileName);

    // 4. Simpan data tanda waktu ke database
    const { data: timeSignatureDataInserted, error: insertError } =
      await this.supabase
        .from('time_signature')
        .insert({
          name,
          date,
          file_url: publicUrlData.publicUrl,
        })
        .select()
        .single();

    if (insertError) {
      return {
        success: false,
        message: 'Gagal menyimpan data tanda waktu',
        error: insertError,
      };
    }

    return {
      success: true,
      message: 'Data tanda waktu berhasil disimpan',
      data: timeSignatureDataInserted,
    };

    // 5. Mencatat ke activity log
    const createdAt = new Date().toLocaleString('en-US', {
      timeZone: 'Asia/Jakarta',
    });

    await this.activityLogService.logActivity({
      admin_id: user_id,
      action: 'Menambahkan Data Tanda Waktu',
      description: `${namaAdmin} menambahkan tanda waktu dengan nama ${name} untuk tanggal ${date}.`,
      ip_address: ipAddress,
      user_agent: userAgent,
      created_at: createdAt,
    });

    return {
      success: true,
      message: 'Berhasil menyimpan data tanda waktu dan mengunggah gambar',
      data: timeSignatureDataInserted,
    };
  }

  /**
   * Menyimpan data excel tanda waktu dan mencatat ke activity log
   */
  async saveExcelTimeSignature(
    dto: CreateTimeSignatureExcelDto,
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

        const timeSignature = row['nama'];
        if (!timeSignature) {
          console.error('Nama tidak valid untuk data:', row);
          return null;
        }

        return {
          name: timeSignature,
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

    // 5. Simpan data tanda waktu ke dalam tabel 'time_signature'
    const { data: insertedTimeSignature, error: timeSignatureError } =
      await this.supabase
        .from('time_signature')
        .insert(dataWithFormattedDate)
        .select();

    if (
      timeSignatureError ||
      !insertedTimeSignature ||
      insertedTimeSignature.length === 0
    ) {
      return {
        success: false,
        message: 'Gagal menyimpan data tanda waktu',
        error: timeSignatureError,
      };
    }

    // 6. Mencatat ke activity log
    const createdAt = new Date().toLocaleString('en-US', {
      timeZone: 'Asia/Jakarta',
    });

    await this.activityLogService.logActivity({
      admin_id: user_id,
      action: 'Menambahkan Data Tanda Waktu',
      description: `${namaAdmin} menambahkan data tanda waktu dengan mengunggah file excel.`,
      ip_address: ipAddress,
      user_agent: userAgent,
      created_at: createdAt,
    });

    return {
      success: true,
      message: 'Berhasil menyimpan data tanda waktu',
      data: insertedTimeSignature,
    };
  }

  /**
   * Mengubah data tanda waktu, mengupload file baru (jika ada) serta menghapus file lama di Supabase Storage
   * dan mencatat ke activity log.
   */
  async updateTimeSignature(
    dto: EditTimeSignatureDto,
    ipAddress: string,
    userAgent: string,
  ) {
    const { id, user_id, name, date, file_base64 } = dto;

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

    // 2. Ambil data tanda waktu saat ini
    const { data: timeSignatureData, error: timeSignatureError } =
      await this.supabase
        .from('time_signature')
        .select('*')
        .eq('id', id)
        .single();

    if (timeSignatureError || !timeSignatureData) {
      return {
        success: false,
        message: 'Data tanda waktu tidak ditemukan',
        error: timeSignatureError,
      };
    }

    const bucketName = 'time-signatures';
    let newFileUrl = timeSignatureData.file_url;

    // 3. Jika terdapat file baru, hapus file lama dan upload file baru
    if (file_base64) {
      // Perbaiki base64 jika tidak standar
      let fixedBase64 = file_base64;
      if (fixedBase64.startsWith('data:@file/jpeg;base64,')) {
        fixedBase64 = fixedBase64.replace(
          'data:@file/jpeg;base64,',
          'data:image/jpeg;base64,',
        );
      }

      // Jika file_url sudah ada, hapus file lama dari storage
      if (timeSignatureData.file_url) {
        const parts = timeSignatureData.file_url.split('/');
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

    // 4. Update data tanda waktu berdasarkan id
    const { data: updatedRecord, error: updateError } = await this.supabase
      .from('time_signature')
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
        message: 'Gagal mengubah data tanda waktu',
        error: updateError,
      };
    }

    // 5. Mencatat ke activity log
    const createdAt = new Date().toLocaleString('en-US', {
      timeZone: 'Asia/Jakarta',
    });

    await this.activityLogService.logActivity({
      admin_id: user_id,
      action: 'Mengubah Data Tanda Waktu',
      description: `${namaAdmin} mengubah data tanda waktu dengan nama ${name} untuk tanggal ${date}.`,
      ip_address: ipAddress,
      user_agent: userAgent,
      created_at: createdAt,
    });

    return {
      success: true,
      message:
        'Berhasil mengubah data tanda waktu dan mengupdate file pada storage',
      data: updatedRecord,
    };
  }

  /**
   * Menghapus data tanda waktu, hapus file baru (jika ada) di Supabase Storage
   * dan mencatat ke activity log.
   */
  async deleteTimeSignature(
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
    const { data: timeSignatureData, error: getDataError } = await this.supabase
      .from('time_signature')
      .select('*')
      .eq('id', id)
      .single();

    if (getDataError || !timeSignatureData) {
      return {
        success: false,
        message: 'Data tanda waktu tidak ditemukan',
        error: getDataError,
      };
    }

    const { name, date } = timeSignatureData;

    const bucketName = 'time-signatures';

    // 3. Hapus file dari storage jika ada file_url
    if (timeSignatureData.file_url) {
      const parts = timeSignatureData.file_url.split('/');
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
      .from('time_signature')
      .delete()
      .eq('id', id)
      .select()
      .single();

    if (deleteError) {
      return {
        success: false,
        message: 'Gagal menghapus data tanda waktu dari database',
        error: deleteError,
      };
    }

    // 5. Catat aktivitas penghapusan
    const createdAt = new Date().toLocaleString('en-US', {
      timeZone: 'Asia/Jakarta',
    });

    await this.activityLogService.logActivity({
      admin_id: user_id,
      action: 'Menghapus Data Tanda Waktu',
      description: `${namaAdmin} menghapus data tanda waktu dengan nama ${name} untuk tanggal ${date}.`,
      ip_address: ipAddress,
      user_agent: userAgent,
      created_at: createdAt,
    });

    return {
      success: true,
      message: 'Berhasil menghapus data tanda waktu dan file terkait',
      data: deletedData,
    };
  }

  /**
   * Mengambil semua data tanda waktu
   */
  async getAllTimeSignature() {
    const { data, error } = await this.supabase
      .from('time_signature')
      .select('*');

    if (error || !data) {
      return {
        success: false,
        message: 'Gagal mengambil data tanda waktu',
        error,
      };
    }

    return {
      success: true,
      message: 'Berhasil mengambil semua data tanda waktu',
      data: data,
    };
  }

  /**
   * Mengambil semua data tanda waktu berdasarkan id
   */
  async getTimeSignatureById(id: number) {
    const { data, error } = await this.supabase
      .from('time_signature')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return {
        success: false,
        message: 'Gagal mengambil data tanda waktu berdasarkan id',
        error,
      };
    }

    return {
      success: true,
      message: 'Berhasil mengambil data tanda waktu berdasarkan id',
      data,
    };
  }

  /**
   * Mengambil data tanda waktu berdasarkan rentang tanggal
   */
  async getTimeSignatureByDate(dto: FilterTimeSignatureByDateDto) {
    const { start_date, end_date } = dto;

    const { data, error } = await this.supabase
      .from('time_signature')
      .select('*')
      .gte('date', start_date)
      .lte('date', end_date);

    if (error || !data) {
      return {
        success: false,
        message: 'Gagal mengambil data tanda waktu berdasarkan rentang tanggal',
        error,
      };
    }

    return {
      success: true,
      message:
        'Berhasil mengambil data tanda waktu berdasarkan rentang tanggal',
      data,
    };
  }
}
