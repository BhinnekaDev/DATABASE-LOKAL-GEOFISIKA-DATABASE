export interface EarthquakeDataExcel {
  mmi: string;
  waktu: string;
  bujur: number;
  lintang: number;
  magnitudo: number;
  deskripsi: string;
  tanggal: string | null;
  'kedalaman (km)': number;
  'nama pengamat': string;
}
