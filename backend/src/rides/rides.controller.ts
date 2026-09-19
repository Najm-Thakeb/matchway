import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Query,
} from '@nestjs/common';

import type { CreateRideDto } from './create-ride.dto.js';
import { RidesService } from './rides.service.js';

@Controller('rides')
export class RidesController {
  constructor(private readonly ridesService: RidesService) {}

  /*
   * Neue Fahrt erstellen
   *
   * POST /rides
   */
  @Post()
  create(@Body() dto: CreateRideDto) {
    return this.ridesService.create(dto);
  }

  /*
   * Fahrten suchen
   *
   * GET /rides/search
   */
  @Get('search')
  search(
    @Query('from')
    from: string,

    @Query('to')
    to: string,

    @Query('date')
    date: string,

    @Query('passengers')
    passengersString: string,

    @Query('fromPlaceId')
    fromPlaceId?: string,

    @Query('toPlaceId')
    toPlaceId?: string,
  ) {
    if (!from || !to || !date) {
      throw new BadRequestException('From, to and date are required.');
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new BadRequestException('Date must use YYYY-MM-DD.');
    }

    const passengers = Number(passengersString);

    if (!Number.isInteger(passengers) || passengers < 1) {
      throw new BadRequestException('Passengers must be a positive integer.');
    }

    return this.ridesService.search(
      from,
      to,
      date,
      passengers,
      fromPlaceId,
      toPlaceId,
    );
  }

  /*
   * Alle Fahrten
   *
   * GET /rides
   */
  @Get()
  findAll() {
    return this.ridesService.findAll();
  }
}
