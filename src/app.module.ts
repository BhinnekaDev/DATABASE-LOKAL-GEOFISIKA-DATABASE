import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AppService } from '@/app.service';
import { AuthModule } from '@/auth/auth.module';
import { AppController } from '@/app.controller';
import { AdminModule } from '@/admin/admin.module';
import { LoginLogModule } from '@/login-log/login-log.module';
import { RainyDaysModule } from '@/rainy-days/rainy-days.module';
import { EvaporationModule } from '@/evaporation/evaporation.module';
import { ActivityLogModule } from '@/activity-log/activity-log.module';
import { MaxTemperatureModule } from '@/max-temperature/max-temperature.module';
import { MinTemperatureModule } from '@/min-temperature/min-temperature.module';

const moduleFeatures = [
  AuthModule,
  AdminModule,
  LoginLogModule,
  RainyDaysModule,
  EvaporationModule,
  ActivityLogModule,
  MaxTemperatureModule,
  MinTemperatureModule,
];

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), ...moduleFeatures],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
