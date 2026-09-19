import { BadRequestException, Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma.service.js';
import type { CreateRideDto } from './create-ride.dto.js';

@Injectable()
export class RidesService {
  constructor(private readonly prisma: PrismaService) {}

  /*
   * Neue Fahrt erstellen
   */
  async create(dto: CreateRideDto) {
    if (
      !dto.fromPlaceId ||
      !dto.pickupPlaceId ||
      !dto.toPlaceId ||
      !dto.dropoffPlaceId
    ) {
      throw new BadRequestException('Pickup and drop-off are required.');
    }

    if (!dto.departureDate || !dto.departureTime) {
      throw new BadRequestException('Departure date and time are required.');
    }

    if (dto.availableSeats < 1) {
      throw new BadRequestException('At least one seat is required.');
    }

    if (dto.pricePerSeat <= 0) {
      throw new BadRequestException('Price must be greater than zero.');
    }

    /*
     * Vorerst verwenden wir +03:00,
     * weil unser erster Markt Jordanien ist.
     *
     * Später machen wir die Zeitzone
     * abhängig vom Land / Ort.
     */
    const departureAt = new Date(
      `${dto.departureDate}T${dto.departureTime}:00+03:00`,
    );

    if (isNaN(departureAt.getTime())) {
      throw new BadRequestException('Invalid departure date or time.');
    }

    /*
     * Google Routes hat uns bereits
     * die Fahrtdauer gegeben.
     *
     * Beispiel:
     * Departure 08:00
     * Duration 4 Stunden
     * → Arrival 12:00
     */
    const arrivalAt = new Date(
      departureAt.getTime() + dto.routeDurationSeconds * 1000,
    );

    const bookingPreference =
      dto.bookingPreference === 'instant' ? 'INSTANT' : 'REVIEW';

    const ride = await this.prisma.ride.create({
      data: {
        // START CITY
        fromPlaceId: dto.fromPlaceId,

        fromLabel: dto.fromLabel,

        // EXACT PICKUP
        pickupPlaceId: dto.pickupPlaceId,

        pickupLabel: dto.pickupLabel,

        // DESTINATION CITY
        toPlaceId: dto.toPlaceId,

        toLabel: dto.toLabel,

        // EXACT DROP-OFF
        dropoffPlaceId: dto.dropoffPlaceId,

        dropoffLabel: dto.dropoffLabel,

        // DATE + TIME
        departureAt,
        arrivalAt,

        // ROUTE
        routeDistanceMeters: dto.routeDistanceMeters,

        routeDurationSeconds: dto.routeDurationSeconds,

        // PRICE
        price: dto.pricePerSeat,

        currency: dto.currency,

        // SEATS
        availableSeats: dto.availableSeats,

        // BOOKING
        bookingPreference,

        // OPTIONAL COMMENT
        comment: dto.comment?.trim() || null,

        /*
         * TEMPORÄR:
         *
         * Wir haben noch kein Login/User-System.
         * Deshalb braucht die Datenbank vorerst
         * einen Test-Fahrer.
         *
         * Später kommt hier:
         * driverId → User
         */
        driverName: 'Test Driver',

        rating: null,

        // OPTIONAL STOPS
        stops: {
          create: dto.stops.map((stop, index) => ({
            placeId: stop.placeId,

            label: stop.label,

            position: index + 1,
          })),
        },
      },

      include: {
        stops: {
          orderBy: {
            position: 'asc',
          },
        },
      },
    });

    return ride;
  }

  /*
   * Alle Fahrten
   */
  async findAll() {
    const rides = await this.prisma.ride.findMany({
      orderBy: {
        departureAt: 'asc',
      },
    });

    return rides.map((ride) => this.formatRide(ride));
  }

  /*
   * Fahrten suchen
   */
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
     * Zuerst suchen wir professionell
     * über die eindeutigen
     * Google Place IDs.
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
          departureAt: 'asc',
        },
      });

      if (ridesByPlaceId.length > 0) {
        return ridesByPlaceId.map((ride) => this.formatRide(ride));
      }
    }

    /*
     * Übergang für unsere alte
     * Testfahrt.
     *
     * Später entfernen wir diesen Teil,
     * wenn alle Fahrten echte
     * Place IDs haben.
     */
    const ridesByLabel = await this.prisma.ride.findMany({
      where: {
        fromLabel: {
          startsWith: from,
          mode: 'insensitive',
        },

        toLabel: {
          startsWith: to,
          mode: 'insensitive',
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
        departureAt: 'asc',
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

      duration: `${hours}:${String(minutes).padStart(2, '0')}`,

      price: Number(ride.price),

      availableSeats: ride.availableSeats,

      driver: ride.driverName,

      rating: ride.rating !== null ? Number(ride.rating) : 0,

      vehicleType: 'car',
    };
  }

  private getCityName(label: string) {
    return label.split(',')[0].trim();
  }

  private formatTime(date: Date) {
    return date.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,

      timeZone: 'Asia/Amman',
    });
  }
}
