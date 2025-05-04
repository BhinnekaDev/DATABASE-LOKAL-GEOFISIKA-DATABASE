import { Injectable } from '@nestjs/common';

@Injectable()
export class RoleHelperService {
  /**
   * Mengubah role menjadi format huruf kapital di awal.
   */
  formatRole(role: string): string {
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
