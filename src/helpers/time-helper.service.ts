import { Injectable } from '@nestjs/common';
import { toZonedTime, format } from 'date-fns-tz';

@Injectable()
export class TimeHelperService {
  /**
   * Fungsi untuk mengubah tanggal menjadi format yang sesuai.
   * @param date - Tanggal yang akan diubah.
   * @param timeZone - Zona waktu yang akan digunakan.
   * @returns Tanggal dalam format yang sesuai.
   */
  formatCreatedAt(date: Date, timeZone: string): string {
    const zonedDate = toZonedTime(date, timeZone);
    return format(zonedDate, "yyyy-MM-dd'T'HH:mm:ss.SSSXXX", {
      timeZone: 'UTC',
    });
  }
}
