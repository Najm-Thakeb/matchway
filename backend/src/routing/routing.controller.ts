import { BadRequestException, Controller, Get, Query } from "@nestjs/common";
import { RoutingService } from "./routing.service.js";

@Controller("routing")
export class RoutingController {
  constructor(private readonly routingService: RoutingService) {}

  @Get()
  getRoute(
    @Query("originPlaceId")
    originPlaceId: string,

    @Query("destinationPlaceId")
    destinationPlaceId: string,
  ) {
    if (!originPlaceId || !destinationPlaceId) {
      throw new BadRequestException("Origin and destination are required.");
    }

    return this.routingService.getRoute(originPlaceId, destinationPlaceId);
  }
}
