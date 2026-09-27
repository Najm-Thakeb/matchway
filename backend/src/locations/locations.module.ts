import { Module } from '@nestjs/common';

import { RoutingModule } from '../routing/routing.module.js';

import { LocationsController } from './locations.controller.js';

import { LocationsService } from './locations.service.js';

import { RouteCitiesService } from './route-cities.service.js';

import { PlaceDetailsController } from './place-details.controller.js';

@Module({
  imports: [RoutingModule],

  controllers: [LocationsController, PlaceDetailsController],

  providers: [LocationsService, RouteCitiesService],

  exports: [LocationsService, RouteCitiesService],
})
export class LocationsModule {}
