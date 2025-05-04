import * as dotenv from 'dotenv';
import { ConfigService } from '@nestjs/config';
import { Injectable, BadRequestException } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

import { DeleteAdminDto } from '@/admin/dto/delete-admin.dto';
import { AdminUser, DeleteResponse } from '@/admin/admin.types';
import { TimeHelperService } from '@/helpers/time-helper.service';
import { ActivityLogService } from '@/activity-log/activity-log.service';

dotenv.config();

@Injectable()
export class AdminService {
  private supabase: SupabaseClient;

  constructor(
    private configService: ConfigService,
    private timeHelperService: TimeHelperService,
    private activityLogService: ActivityLogService,
  ) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>(
      'SUPABASE_SERVICE_ROLE_KEY',
    );

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase URL atau Service Role Key tidak ditemukan.');
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
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
  private async getAdminDataByUserId(user_id: string) {
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
   * Menghapus admin dari Supabase Auth dan mencatat aktivitas.
   */
  async deleteAdmin(
    { user_id, id_role }: DeleteAdminDto,
    ip_address: string,
    user_agent: string,
  ): Promise<DeleteResponse> {
    // Cek keberadaan user
    const { data: userData, error: fetchError } = await this.supabase
      .from('admin')
      .select('*')
      .eq('user_id', user_id)
      .single();

    if (fetchError || !userData) {
      throw new BadRequestException('User tidak ditemukan.');
    }

    // Ambil data admin yang melakukan penghapusan
    const admin = await this.getAdminDataByRole(id_role);
    const deleterName = `${admin.first_name} ${admin.last_name}`;

    // Ambil data user yang akan dihapus
    const target = await this.getAdminDataByUserId(user_id);
    const targetName = `${target.first_name} ${target.last_name}`;
    const role = this.formatRole(target.role);

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
   * Mengubah role menjadi format huruf kapital di awal.
   */
  private formatRole(role: string): string {
    switch (role) {
      case 'admin':
        return 'Admin';
      case 'operator':
        return 'Operator';
      default:
        return role;
    }
  }
}
