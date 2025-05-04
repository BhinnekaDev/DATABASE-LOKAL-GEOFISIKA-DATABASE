import { Module } from '@nestjs/common';
import { AppService } from '@/app.service';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from '@/auth/auth.module';
import { AppController } from '@/app.controller';
import { AdminModule } from '@/admin/admin.module';
import { LoginLogModule } from '@/login-log/login-log.module';
import { EvaporationModule } from '@/evaporation/evaporation.module';
import { ActivityLogModule } from '@/activity-log/activity-log.module';
import { MaxTemperaturModule } from '@/max-temperatur/max-temperatur.module';

@Module({
  imports: [
    AuthModule,
    ActivityLogModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    LoginLogModule,
    AdminModule,
    EvaporationModule,
    MaxTemperaturModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
