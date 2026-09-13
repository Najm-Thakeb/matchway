import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma.service.js";

@Injectable()
export class RidesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const rides = await this.prisma.ride.findMany({
      orderBy: {
        departureAt: "asc",
      },
    });

    return rides.map((ride) => this.formatRide(ride));
  }

  async search(
    from: string,
    to: string,
    date: string,
    passengers: number,
    fromPlaceId?: string,
    toPlaceId?: string,
  ) {
    const startOfDay = new Date(`${date}T00:00:00+03:00`);

    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

    /*
      Zuerst suchen wir professionell
      über die eindeutigen Google Place IDs.
    */
    if (fromPlaceId && toPlaceId) {
      const ridesByPlaceId = await this.prisma.ride.findMany({
        where: {
          fromPlaceId,
          toPlaceId,

          departureAt: {
            gte: startOfDay,
            lt: endOfDay,
          },

          availableSeats: {
            gte: passengers,
          },
        },

        orderBy: {
          departureAt: "asc",
        },
      });

      if (ridesByPlaceId.length > 0) {
        return ridesByPlaceId.map((ride) => this.formatRide(ride));
      }
    }

    /*
      Übergang für unsere alte Testfahrt.

      Später entfernen wir diesen Teil,
      wenn alle Fahrten echte Place IDs haben.
    */
    const ridesByLabel = await this.prisma.ride.findMany({
      where: {
        fromLabel: {
          startsWith: from,
          mode: "insensitive",
        },

        toLabel: {
          startsWith: to,
          mode: "insensitive",
        },

        departureAt: {
          gte: startOfDay,
          lt: endOfDay,
        },

        availableSeats: {
          gte: passengers,
        },
      },

      orderBy: {
        departureAt: "asc",
      },
    });

    return ridesByLabel.map((ride) => this.formatRide(ride));
  }

  private formatRide(ride: any) {
    const durationMilliseconds =
      ride.arrivalAt.getTime() - ride.departureAt.getTime();

    const totalMinutes = Math.round(durationMilliseconds / 60000);

    const hours = Math.floor(totalMinutes / 60);

    const minutes = totalMinutes % 60;

    return {
      id: ride.id,

      from: this.getCityName(ride.fromLabel),

      to: this.getCityName(ride.toLabel),

      departureTime: this.formatTime(ride.departureAt),

      arrivalTime: this.formatTime(ride.arrivalAt),

      duration: `${hours}:${String(minutes).padStart(2, "0")}`,

      price: Number(ride.price),

      availableSeats: ride.availableSeats,

      driver: ride.driverName,

      rating: ride.rating !== null ? Number(ride.rating) : 0,

      vehicleType: "car",
    };
  }

  private getCityName(label: string) {
    return label.split(",")[0].trim();
  }

  private formatTime(date: Date) {
    return date.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "Asia/Amman",
    });
  }
}
