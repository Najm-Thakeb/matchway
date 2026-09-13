import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";

import { AppController } from "./app.controller.js";
import { AppService } from "./app.service.js";
import { LocationsModule } from "./locations/locations.module.js";
import { RidesModule } from './rides/rides.module.js';
import { RoutingModule } from './routing/routing.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    LocationsModule,
    RidesModule,
    RoutingModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
