import { Buffer } from 'buffer';
import * as dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import { ConfigService } from '@nestjs/config';
import { Injectable, BadRequestException } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

import { DeleteAdminDto } from '@/admin/dto/delete-admin.dto';
import { UpdateAdminDto } from '@/admin/dto/update-admin.dto';
import { RoleHelperService } from '@/helpers/role-helper.service';
import { TimeHelperService } from '@/helpers/time-helper.service';
import { ActivityLogService } from '@/activity-log/activity-log.service';
import { AdminUser, DeleteResponse, EditResponse } from '@/admin/admin.types';

dotenv.config();

@Injectable()
export class AdminService {
  private supabase: SupabaseClient;

  constructor(
    private configService: ConfigService,
    private timeHelperService: TimeHelperService,
    private roleHelperService: RoleHelperService,
    private activityLogService: ActivityLogService,
  ) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>('SUPABASE_KEY');
    const supabaseRoleKey = this.configService.get<string>(
      'SUPABASE_SERVICE_ROLE_KEY',
    );

    if (!supabaseUrl || !supabaseKey || !supabaseRoleKey) {
      throw new Error('Supabase URL atau Service Role Key tidak ditemukan.');
    }

    this.supabase = createClient(supabaseUrl, supabaseRoleKey);
  }

  /**
   * Mengambil data admin berdasarkan id_role (yang sedang login).
   */
  private async getAdminDataByRole(id_role: string) {
    const { data, error } = await this.supabase
      .from('admin')
      .select('first_name, last_name')
      .eq('user_id', id_role)
      .limit(1);

    if (error) throw new BadRequestException(error.message);
    if (!data?.length)
      throw new BadRequestException(
        'Admin tidak ditemukan berdasarkan id_role.',
      );

    return data[0];
  }

  /**
   * Mengambil data admin berdasarkan user_id (yang akan dihapus).
   */
  private async getPartAdminDataByUserId(user_id: string) {
    const { data, error } = await this.supabase
      .from('admin')
      .select('first_name, last_name, role')
      .eq('user_id', user_id)
      .limit(1);

    if (error) throw new BadRequestException(error.message);
    if (!data?.length)
      throw new BadRequestException(
        'Admin tidak ditemukan berdasarkan user_id.',
      );

    return data[0];
  }

  /**
   * Mengubah admin atau operator dari Supabase Auth dan mencatat aktivitas.
   */
  async updateAdmin(
    updateAdminDto: UpdateAdminDto,
    ip_address: string,
    user_agent: string,
  ): Promise<EditResponse> {
    const {
      user_id,
      id_role,
      email,
      password,
      first_name,
      last_name,
      file_base64,
      role,
    } = updateAdminDto;

    // Cek keberadaan user di tabel admin
    const { data: userData, error: fetchError } = await this.supabase
      .from('admin')
      .select('*')
      .eq('user_id', user_id)
      .single();

    if (fetchError || !userData) {
      throw new BadRequestException('User tidak ditemukan.');
    }

    // Perbarui data di Supabase Auth (email dan password)
    const { error: updateAuthError } =
      await this.supabase.auth.admin.updateUserById(user_id, {
        email,
        password,
        user_metadata: {
          first_name,
          last_name,
          full_name: `${first_name} ${last_name}`,
        },
      });

    if (updateAuthError) {
      throw new BadRequestException(
        'Gagal memperbarui data pengguna di Supabase Auth.',
      );
    }

    const bucketName = 'admin';
    let photo = userData.photo;

    if (file_base64) {
      // Hapus file lama jika ada
      if (userData.photo) {
        const oldFilePath = userData.photo.split('/').pop();
        await this.supabase.storage.from(bucketName).remove([oldFilePath]);
      }

      // Upload file baru
      const newFileName = `${uuidv4()}.jpg`;
      const base64Data = file_base64.replace(/^data:image\/\w+;base64,/, '');
      const fileBuffer = Buffer.from(base64Data, 'base64');

      const { error: uploadError } = await this.supabase.storage
        .from(bucketName)
        .upload(newFileName, fileBuffer, {
          contentType: 'image/jpeg',
        });

      if (uploadError) {
        throw new BadRequestException('Gagal mengunggah foto baru ke storage.');
      }

      // Ambil URL publik
      const { data: publicUrlData } = this.supabase.storage
        .from(bucketName)
        .getPublicUrl(newFileName);

      photo = publicUrlData.publicUrl;
    }

    // Perbarui data admin di tabel `admin`
    const { error: updateAdminError } = await this.supabase
      .from('admin')
      .update({
        email,
        first_name,
        last_name,
        photo,
        role,
      })
      .eq('user_id', user_id);

    if (updateAdminError) {
      throw new BadRequestException(
        'Gagal memperbarui data admin di tabel admin.',
      );
    }

    // Ambil data admin yang melakukan pembaruan
    const target = await this.getPartAdminDataByUserId(user_id);
    const admin = await this.getAdminDataByRole(id_role);
    const updaterName = `${admin.first_name} ${admin.last_name}`;
    const roleTarget = this.roleHelperService.formatRole(target.role);

    // Format waktu
    const timeZone = 'Asia/Jakarta';
    const date = new Date();
    const formattedCreatedAt = this.timeHelperService.formatCreatedAt(
      date,
      timeZone,
    );

    // Catat log aktivitas
    await this.activityLogService.logActivity({
      admin_id: id_role,
      action: `Memperbarui Data ${roleTarget}`,
      description: `${updaterName} memperbarui data admin ${first_name} ${last_name}.`,
      ip_address,
      user_agent,
      created_at: formattedCreatedAt,
    });

    // Kembalikan data yang telah diperbarui
    const updatedAdmin: AdminUser = {
      id: userData.id,
      email,
      first_name,
      last_name,
      photo: userData.photo,
      role: userData.role,
      user_id: userData.user_id,
    };

    return {
      user: updatedAdmin,
      status: 'success',
    };
  }

  /**
   * Menghapus admin atau operator dari Supabase Auth dan mencatat aktivitas.
   */
  async deleteAdmin(
    { user_id, id_role }: DeleteAdminDto,
    ip_address: string,
    user_agent: string,
  ): Promise<DeleteResponse> {
    const bucketName = 'admin';

    // Cek keberadaan user
    const { data: userData, error: fetchError } = await this.supabase
      .from('admin')
      .select('*')
      .eq('user_id', user_id)
      .single();

    if (fetchError || !userData) {
      throw new BadRequestException('User tidak ditemukan.');
    }

    // Hapus file foto dari storage jika ada
    if (userData.photo) {
      const fileName = userData.photo.split('/').pop();
      await this.supabase.storage.from(bucketName).remove([fileName]);
    }

    // Ambil data admin yang melakukan penghapusan
    const admin = await this.getAdminDataByRole(id_role);
    const deleterName = `${admin.first_name} ${admin.last_name}`;

    // Ambil data user yang akan dihapus
    const target = await this.getPartAdminDataByUserId(user_id);
    const targetName = `${target.first_name} ${target.last_name}`;
    const role = this.roleHelperService.formatRole(target.role);

    // Format waktu
    const timeZone = 'Asia/Jakarta';
    const date = new Date();
    const formattedCreatedAt = this.timeHelperService.formatCreatedAt(
      date,
      timeZone,
    );

    // Catat log aktivitas
    await this.activityLogService.logActivity({
      admin_id: id_role,
      action: `Menghapus ${role}`,
      description: `${deleterName} menghapus ${targetName} dari database.`,
      ip_address,
      user_agent,
      created_at: formattedCreatedAt,
    });

    // Hapus dari Supabase Auth
    const { error: deleteError } =
      await this.supabase.auth.admin.deleteUser(user_id);
    if (deleteError) {
      throw new BadRequestException('Gagal menghapus user dari Supabase Auth.');
    }

    // Kembalikan data yang telah dihapus
    const adminUser: AdminUser = {
      id: userData.id,
      email: userData.email,
      first_name: userData.first_name,
      last_name: userData.last_name,
      photo: userData.photo,
      role: userData.role,
      user_id: userData.user_id,
    };

    return {
      user: adminUser,
      status: 'success',
    };
  }

  /**
   * Mengambil data admin atau operator dari Supabase.
   */
  async getAdmin(): Promise<AdminUser[]> {
    const { data, error } = await this.supabase
      .from('admin')
      .select('id, email, first_name, last_name, photo, role, user_id');

    if (error) {
      throw new BadRequestException(
        'Gagal mengambil data admin: ' + error.message,
      );
    }

    return data as AdminUser[];
  }

  /**
   * Mengambil data admin atau operator dari Supabase berdasarkan user_id.
   */
  async getAdminDataByUserId(user_id: string): Promise<AdminUser> {
    const { data, error } = await this.supabase
      .from('admin')
      .select('id, email, first_name, last_name, photo, role, user_id')
      .eq('user_id', user_id)
      .single();

    if (error) {
      throw new BadRequestException(
        'Gagal mengambil data admin: ' + error.message,
      );
    }

    return data as AdminUser;
  }
}
