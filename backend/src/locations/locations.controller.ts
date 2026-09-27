import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Query,
} from '@nestjs/common';

import type { MeetingPointCandidatesDto } from './meeting-point-candidates.dto.js';

import type { OptimizeMeetingPointsDto } from './optimize-meeting-points.dto.js';

import type { RouteCitySuggestionsDto } from './route-city-suggestions.dto.js';

import { LocationsService } from './locations.service.js';
import { RouteCitiesService } from './route-cities.service.js';

@Controller('locations')
export class LocationsController {
  constructor(
    private readonly locationsService: LocationsService,

    private readonly routeCitiesService: RouteCitiesService,
  ) {}

  @Get('autocomplete')
  autocomplete(
    @Query('q')
    query: string,
  ) {
    return this.locationsService.autocomplete(query);
  }

  @Post('meeting-point-candidates')
  meetingPointCandidates(
    @Body()
    dto: MeetingPointCandidatesDto,
  ) {
    if (!dto.stopPlaceId) {
      throw new BadRequestException('Stop place ID is required.');
    }

    return this.locationsService.findMeetingPointCandidates(dto.stopPlaceId);
  }

  @Post('optimize-meeting-points')
  optimizeMeetingPoints(
    @Body()
    dto: OptimizeMeetingPointsDto,
  ) {
    if (!dto.originPlaceId || !dto.destinationPlaceId) {
      throw new BadRequestException('Origin and destination are required.');
    }

    if (!Array.isArray(dto.stops)) {
      throw new BadRequestException('Stops must be an array.');
    }

    if (dto.stops.length > 5) {
      throw new BadRequestException('A maximum of 5 stops can be optimized.');
    }

    for (const stop of dto.stops) {
      if (!stop.placeId || !stop.label) {
        throw new BadRequestException(
          'Every stop requires a place ID and label.',
        );
      }
    }

    return this.locationsService.optimizeMeetingPoints(
      dto.originPlaceId,
      dto.destinationPlaceId,
      dto.stops,
    );
  }

  /*
   * Neu:
   *
   * Städte entlang der vom Fahrer
   * ausgewählten Route finden.
   */
  @Post('route-city-suggestions')
  routeCitySuggestions(
    @Body()
    dto: RouteCitySuggestionsDto,
  ) {
    if (!Array.isArray(dto.coordinates) || dto.coordinates.length < 2) {
      throw new BadRequestException(
        'At least two route coordinates are required.',
      );
    }

    for (const coordinate of dto.coordinates) {
      if (
        typeof coordinate.latitude !== 'number' ||
        typeof coordinate.longitude !== 'number'
      ) {
        throw new BadRequestException('Invalid route coordinate.');
      }
    }

    return this.routeCitiesService.findCitiesAlongRoute(
      dto.coordinates,
      dto.excludedPlaceIds ?? [],
    );
  }
}
