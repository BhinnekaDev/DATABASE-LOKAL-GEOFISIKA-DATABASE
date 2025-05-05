import { Request } from 'express';
import { ApiTags, ApiOkResponse } from '@nestjs/swagger';
import {
  Req,
  Get,
  Put,
  Post,
  Body,
  Query,
  Delete,
  Controller,
} from '@nestjs/common';

import { MinTemperatureService } from '@/min-temperature/min-temperature.service';
import { CreateMinTemperatureDto } from '@/min-temperature/dto/create-min-temperature.dto';

@ApiTags('Min Temperatue')
@Controller('min-temperature')
export class MinTemperatureController {
  constructor(private readonly minTemperaturService: MinTemperatureService) {}
}
