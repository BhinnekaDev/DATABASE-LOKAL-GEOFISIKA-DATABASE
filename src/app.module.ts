import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AppService } from '@/app.service';
import { AuthModule } from '@/auth/auth.module';
import { AppController } from '@/app.controller';
import { AdminModule } from '@/admin/admin.module';
import { HumidityModule } from '@/humidity/humidity.module';
import { RainfallModule } from '@/rainfall/rainfall.module';
import { LoginLogModule } from '@/login-log/login-log.module';
import { LightningModule } from '@/lightning/lightning.module';
import { RainGaugeModule } from '@/rain-gauge/rain-gauge.module';
import { RainyDaysModule } from '@/rainy-days/rainy-days.module';
import { EarthquakeModule } from '@/earthquake/earthquake.module';
import { EvaporationModule } from '@/evaporation/evaporation.module';
import { ActivityLogModule } from '@/activity-log/activity-log.module';
import { AirPressureModule } from '@/air-pressure/air-pressure.module';
import { MicrothermorModule } from '@/microthermor/microthermor.module';
import { TimeSignatureModule } from '@/time-signature/time-signature.module';
import { RainIntensityModule } from '@/rain-intensity/rain-intensity.module';
import { MaxTemperatureModule } from '@/max-temperature/max-temperature.module';
import { MinTemperatureModule } from '@/min-temperature/min-temperature.module';
import { SunshineDurationModule } from '@/sunshine-duration/sunshine-duration.module';
import { AverageTemperatureModule } from '@/average-temperature/average-temperature.module';
import { WindDirectionAndSpeedModule } from '@/wind-direction-and-speed/wind-direction-and-speed.module';

const moduleFeatures = [
  AuthModule,
  AdminModule,
  LoginLogModule,
  RainfallModule,
  HumidityModule,
  RainGaugeModule,
  RainyDaysModule,
  LightningModule,
  EarthquakeModule,
  EvaporationModule,
  ActivityLogModule,
  AirPressureModule,
  MicrothermorModule,
  RainIntensityModule,
  TimeSignatureModule,
  MaxTemperatureModule,
  MinTemperatureModule,
  SunshineDurationModule,
  AverageTemperatureModule,
  WindDirectionAndSpeedModule,
];

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), ...moduleFeatures],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
