import { Injectable } from '@nestjs/common';
import { toZonedTime, format } from 'date-fns-tz';

@Injectable()
export class TimeHelperService {
  // Fungsi untuk memformat waktu ke UTC dari zona waktu tertentu
  formatCreatedAt(date: Date, timeZone: string): string {
    const zonedDate = toZonedTime(date, timeZone);
    return format(zonedDate, "yyyy-MM-dd'T'HH:mm:ss.SSSXXX", {
      timeZone: 'UTC',
    });
  }
}
