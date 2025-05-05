import { Request } from 'express';
import { ApiTags, ApiOkResponse } from '@nestjs/swagger';
import { Controller, Delete, Query, Req, Put, Body, Get } from '@nestjs/common';

import { AdminService } from '@/admin/admin.service';
import { DeleteAdminDto } from '@/admin/dto/delete-admin.dto';
import { UpdateAdminDto } from '@/admin/dto/update-admin.dto';

@ApiTags('Admin')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // Route untuk update
  @Put('edit')
  async updateAdmin(
    @Query() querys: UpdateAdminDto,
    @Body() updateAdminDto: UpdateAdminDto,
    @Req() req: Request,
  ) {
    const ipAddress = req.ip as string;
    const userAgent = req.headers['user-agent'] as string;

    const updatedAdminData = {
      ...updateAdminDto,
      user_id: querys.user_id,
      id_role: querys.id_role,
    };

    return this.adminService.updateAdmin(
      updatedAdminData,
      ipAddress,
      userAgent,
    );
  }
  // Route untuk delete
  @Delete('delete')
  async deleteAdmin(@Query() querys: DeleteAdminDto, @Req() req: Request) {
    const ipAddress = req.ip as string;
    const userAgent = req.headers['user-agent'] as string;

    return this.adminService.deleteAdmin(querys, ipAddress, userAgent);
  }

  // Route untuk ambil data admin
  @Get('get-all')
  @ApiOkResponse({
    description: 'Berhasil mengambil data admin.',
  })
  async getAdminData() {
    return this.adminService.getAdmin();
  }

  // Route untuk ambil data admin berdasarkan user_id
  @Get('get')
  @ApiOkResponse({
    description: 'Berhasil mengambil data admin berdasarkan user id.',
  })
  async getAdminDataByUserId(@Query('user_id') user_id: string) {
    return this.adminService.getAdminDataByUserId(user_id);
  }
}
