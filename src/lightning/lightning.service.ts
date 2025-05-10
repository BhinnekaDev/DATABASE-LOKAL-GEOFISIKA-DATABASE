import { Buffer } from 'buffer';
import * as dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

import { EditLightningDto } from '@/lightning/dto/edit-lightning.dto';
import { ActivityLogService } from '@/activity-log/activity-log.service';
import { CreateLightningDto } from '@/lightning/dto/create-lightning.dto';
import { FilterLightningByDateDto } from '@/lightning/dto/filterLightningByDateDto';

dotenv.config();

@Injectable()
export class LightningService {
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
   * Menyimpan data petir dan mencatat ke activity log
   */
  async saveLightning(
    dto: CreateLightningDto,
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
    const bucketName = 'lightning';

    // Convert base64 ke Buffer
    const base64Data = file_base64.replace(/^data:image\/\w+;base64,/, '');
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

    // 3. Simpan ke database
    const { data: publicUrlData } = this.supabase.storage
      .from(bucketName)
      .getPublicUrl(fileName);

    // 4. Simpan data petir
    const { data: lightningDataInserted, error: insertError } =
      await this.supabase
        .from('lightning')
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
        message: 'Gagal menyimpan data petir',
        error: insertError,
      };
    }

    // 5. Mencatat ke activity log
    const createdAt = new Date().toLocaleString('en-US', {
      timeZone: 'Asia/Jakarta',
    });

    await this.activityLogService.logActivity({
      admin_id: user_id,
      action: 'Menambahkan Data Petir',
      description: `${namaAdmin} menambahkan data petir dengan nama ${name} untuk tanggal ${date}.`,
      ip_address: ipAddress,
      user_agent: userAgent,
      created_at: createdAt,
    });

    return {
      success: true,
      message: 'Berhasil menyimpan data petir dan mengunggah gambar',
      data: lightningDataInserted,
    };
  }

  /**
   * Mengubah data petir, mengupload file baru (jika ada) serta menghapus file lama di Supabase Storage
   * dan mencatat ke activity log.
   */
  async updateLightning(
    dto: EditLightningDto,
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

    // 2. Ambil data petir saat ini
    const { data: lightningData, error: lightningError } = await this.supabase
      .from('lightning')
      .select('*')
      .eq('id', id)
      .single();

    if (lightningError || !lightningData) {
      return {
        success: false,
        message: 'Data petir tidak ditemukan',
        error: lightningError,
      };
    }

    const bucketName = 'lightning';
    let newFileUrl = lightningData.file_url;

    // 3. Jika terdapat file baru, hapus file lama dan upload file baru
    if (file_base64) {
      // Jika file_url sudah ada, hapus file lama dari storage
      if (lightningData.file_url) {
        const parts = lightningData.file_url.split('/');
        const oldFileName = parts[parts.length - 1];

        await this.supabase.storage.from(bucketName).remove([oldFileName]);
      }

      // Upload file baru
      const newFileName = `${uuidv4()}.jpg`;
      const base64Data = file_base64.replace(/^data:image\/\w+;base64,/, '');
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

    // 4. Update data petir berdasarkan id
    const { data: updatedRecord, error: updateError } = await this.supabase
      .from('lightning')
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
        message: 'Gagal mengubah data petir',
        error: updateError,
      };
    }

    // 5. Mencatat ke activity log
    const createdAt = new Date().toLocaleString('en-US', {
      timeZone: 'Asia/Jakarta',
    });

    await this.activityLogService.logActivity({
      admin_id: user_id,
      action: 'Mengubah Data Petir',
      description: `${namaAdmin} mengubah data petir dengan nama ${name} untuk tanggal ${date}.`,
      ip_address: ipAddress,
      user_agent: userAgent,
      created_at: createdAt,
    });

    return {
      success: true,
      message: 'Berhasil mengubah data petir dan mengupdate file pada storage',
      data: updatedRecord,
    };
  }

  /**
   * Menghapus data petir, hapus file baru (jika ada) di Supabase Storage
   * dan mencatat ke activity log.
   */
  async deleteLightning(
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

    // 2. Ambil data petir untuk mendapatkan file_url
    const { data: lightningData, error: getDataError } = await this.supabase
      .from('lightning')
      .select('*')
      .eq('id', id)
      .single();

    if (getDataError || !lightningData) {
      return {
        success: false,
        message: 'Data petir tidak ditemukan',
        error: getDataError,
      };
    }

    const { name, date } = lightningData;

    const bucketName = 'lightning';

    // 3. Hapus file dari storage jika ada file_url
    if (lightningData.file_url) {
      const parts = lightningData.file_url.split('/');
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

    // 4. Hapus data dari tabel petir
    const { data: deletedData, error: deleteError } = await this.supabase
      .from('lightning')
      .delete()
      .eq('id', id)
      .select()
      .single();

    if (deleteError) {
      return {
        success: false,
        message: 'Gagal menghapus data petir dari database',
        error: deleteError,
      };
    }

    // 5. Catat aktivitas penghapusan
    const createdAt = new Date().toLocaleString('en-US', {
      timeZone: 'Asia/Jakarta',
    });

    await this.activityLogService.logActivity({
      admin_id: user_id,
      action: 'Menghapus Data Petir',
      description: `${namaAdmin} menghapus data petir dengan nama ${name} untuk tanggal ${date}.`,
      ip_address: ipAddress,
      user_agent: userAgent,
      created_at: createdAt,
    });

    return {
      success: true,
      message: 'Berhasil menghapus data petir dan file terkait',
      data: deletedData,
    };
  }

  /**
   * Mengambil semua data petir
   */
  async getAllLightning() {
    const { data, error } = await this.supabase.from('lightning').select('*');

    if (error || !data) {
      return {
        success: false,
        message: 'Gagal mengambil data petir',
        error,
      };
    }

    return {
      success: true,
      message: 'Berhasil mengambil semua data petir',
      data: data,
    };
  }

  /**
   * Mengambil semua data petir berdasarkan id
   */
  async getLightningById(id: number) {
    const { data, error } = await this.supabase
      .from('lightning')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return {
        success: false,
        message: 'Gagal mengambil data petir berdasarkan id',
        error,
      };
    }

    return {
      success: true,
      message: 'Berhasil mengambil data petir berdasarkan id',
      data,
    };
  }

  /**
   * Mengambil data petir berdasarkan rentang tanggal
   */
  async getLightningByDate(dto: FilterLightningByDateDto) {
    const { start_date, end_date } = dto;

    const { data, error } = await this.supabase
      .from('lightning')
      .select('*')
      .gte('date', start_date)
      .lte('date', end_date);

    if (error || !data) {
      return {
        success: false,
        message: 'Gagal mengambil data petir berdasarkan rentang tanggal',
        error,
      };
    }

    return {
      success: true,
      message: 'Berhasil mengambil data petir berdasarkan rentang tanggal',
      data,
    };
  }
}
