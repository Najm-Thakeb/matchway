import { BadRequestException, Controller, Get, Query } from "@nestjs/common";
import { RidesService } from "./rides.service.js";

@Controller("rides")
export class RidesController {
  constructor(private readonly ridesService: RidesService) {}

  @Get()
  findAll() {
    return this.ridesService.findAll();
  }

  @Get("search")
  search(
    @Query("from") from: string,
    @Query("to") to: string,
    @Query("fromPlaceId") fromPlaceId: string,
    @Query("toPlaceId") toPlaceId: string,
    @Query("date") date: string,
    @Query("passengers") passengers: string,
  ) {
    if (!from || !to || !date) {
      throw new BadRequestException("From, to and date are required.");
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new BadRequestException("Date must use YYYY-MM-DD format.");
    }

    const passengerCount = Number(passengers ?? 1);

    if (!Number.isInteger(passengerCount) || passengerCount < 1) {
      throw new BadRequestException("Passengers must be at least 1.");
    }

    return this.ridesService.search(
      from,
      to,
      date,
      passengerCount,
      fromPlaceId,
      toPlaceId,
    );
  }
}
