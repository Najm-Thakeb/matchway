import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Query,
} from '@nestjs/common';

import type { CalculateRouteDto } from './calculate-route.dto.js';

import { RoutingService } from './routing.service.js';

@Controller('routing')
export class RoutingController {
  constructor(private readonly routingService: RoutingService) {}

  @Get()
  getRoute(
    @Query('originPlaceId')
    originPlaceId: string,

    @Query('destinationPlaceId')
    destinationPlaceId: string,
  ) {
    if (!originPlaceId || !destinationPlaceId) {
      throw new BadRequestException('Origin and destination are required.');
    }

    return this.routingService.getRoute(
      originPlaceId,
      destinationPlaceId,
      [],
      false,
    );
  }

  @Post()
  calculateRoute(
    @Body()
    dto: CalculateRouteDto,
  ) {
    if (!dto.originPlaceId || !dto.destinationPlaceId) {
      throw new BadRequestException('Origin and destination are required.');
    }

    const intermediatePlaceIds = dto.intermediatePlaceIds ?? [];

    if (!Array.isArray(intermediatePlaceIds)) {
      throw new BadRequestException('Intermediate place IDs must be an array.');
    }

    if (intermediatePlaceIds.length > 25) {
      throw new BadRequestException('Too many intermediate stops.');
    }

    if (
      dto.optimizeWaypointOrder !== undefined &&
      typeof dto.optimizeWaypointOrder !== 'boolean'
    ) {
      throw new BadRequestException('optimizeWaypointOrder must be a boolean.');
    }

    return this.routingService.getRoute(
      dto.originPlaceId,
      dto.destinationPlaceId,
      intermediatePlaceIds,
      dto.optimizeWaypointOrder ?? false,
    );
  }
}
