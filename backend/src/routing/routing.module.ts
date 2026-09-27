import { Module } from '@nestjs/common';

import { RoutingController } from './routing.controller.js';
import { RoutingService } from './routing.service.js';

@Module({
  controllers: [RoutingController],

  providers: [RoutingService],

  /*
   * Neu:
   * Andere Backend-Module dürfen jetzt
   * unsere Routenberechnung benutzen.
   */
  exports: [RoutingService],
})
export class RoutingModule {}
