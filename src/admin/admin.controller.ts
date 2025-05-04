import { Request } from 'express';
import { ApiTags } from '@nestjs/swagger';
import { Controller, Delete, Param, Req, Put, Body } from '@nestjs/common';

import { AdminService } from '@/admin/admin.service';
import { DeleteAdminDto } from '@/admin/dto/delete-admin.dto';
import { UpdateAdminDto } from '@/admin/dto/update-admin.dto';

@ApiTags('Admin')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // Route untuk update
  @Put('edit/:user_id/:id_role')
  async updateAdmin(
    @Param() params: UpdateAdminDto,
    @Body() updateAdminDto: UpdateAdminDto,
    @Req() req: Request,
  ) {
    const ipAddress = req.ip as string;
    const userAgent = req.headers['user-agent'] as string;

    const updatedAdminData = {
      ...updateAdminDto,
      user_id: params.user_id,
      id_role: params.id_role,
    };

    return this.adminService.updateAdmin(
      updatedAdminData,
      ipAddress,
      userAgent,
    );
  }
  // Route untuk delete
  @Delete('delete/:user_id/:id_role')
  async deleteAdmin(@Param() params: DeleteAdminDto, @Req() req: Request) {
    const ipAddress = req.ip as string;
    const userAgent = req.headers['user-agent'] as string;

    return this.adminService.deleteAdmin(params, ipAddress, userAgent);
  }
}
