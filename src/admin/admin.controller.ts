import { Request } from 'express';
import { ApiTags } from '@nestjs/swagger';
import { Controller, Delete, Param, Req } from '@nestjs/common';

import { AdminService } from '@/admin/admin.service';
import { DeleteAdminDto } from '@/admin/dto/delete-admin.dto';

@ApiTags('Admin')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Delete('delete/:user_id/:id_role')
  async deleteAdmin(@Param() params: DeleteAdminDto, @Req() req: Request) {
    const ipAddress = req.ip as string;
    const userAgent = req.headers['user-agent'] as string;

    return this.adminService.deleteAdmin(params, ipAddress, userAgent);
  }
}
