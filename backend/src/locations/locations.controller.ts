import { Controller, Get, Query } from "@nestjs/common";
import { LocationsService } from "./locations.service.js";

@Controller("locations")
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @Get("autocomplete")
  autocomplete(@Query("q") query: string) {
    return this.locationsService.autocomplete(query);
  }
}
