import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AppService } from '@/app.service';
import { AuthModule } from '@/auth/auth.module';
import { AppController } from '@/app.controller';
import { AdminModule } from '@/admin/admin.module';
import { HumidityModule } from '@/humidity/humidity.module';
import { RainfallModule } from '@/rainfall/rainfall.module';
import { LoginLogModule } from '@/login-log/login-log.module';
import { RainyDaysModule } from '@/rainy-days/rainy-days.module';
import { EarthquakeModule } from '@/earthquake/earthquake.module';
import { EvaporationModule } from '@/evaporation/evaporation.module';
import { ActivityLogModule } from '@/activity-log/activity-log.module';
import { AirPressureModule } from '@/air-pressure/air-pressure.module';
import { RainIntensityModule } from '@/rain-intensity/rain-intensity.module';
import { MaxTemperatureModule } from '@/max-temperature/max-temperature.module';
import { MinTemperatureModule } from '@/min-temperature/min-temperature.module';
import { SunshineDurationModule } from '@/sunshine-duration/sunshine-duration.module';
import { AverageTemperatureModule } from '@/average-temperature/average-temperature.module';

const moduleFeatures = [
  AuthModule,
  AdminModule,
  LoginLogModule,
  RainfallModule,
  HumidityModule,
  RainyDaysModule,
  EarthquakeModule,
  EvaporationModule,
  ActivityLogModule,
  AirPressureModule,
  RainIntensityModule,
  MaxTemperatureModule,
  MinTemperatureModule,
  SunshineDurationModule,
  AverageTemperatureModule,
];

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), ...moduleFeatures],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
