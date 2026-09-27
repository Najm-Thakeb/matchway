import { BadRequestException, Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma.service.js';

import type { CreateRideDto } from './create-ride.dto.js';

@Injectable()
export class RidesService {
  constructor(private readonly prisma: PrismaService) {}

  /*
   * ==================================
   * NEUE FAHRT ERSTELLEN
   * ==================================
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

    if (!Array.isArray(dto.stops)) {
      throw new BadRequestException('Stops must be an array.');
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
     * Google Routes hat uns
     * die Fahrtdauer bereits geliefert.
     *
     * Beispiel:
     *
     * Abfahrt: 08:00
     * Dauer: 4 Stunden
     *
     * Ankunft: 12:00
     */
    const arrivalAt = new Date(
      departureAt.getTime() + dto.routeDurationSeconds * 1000,
    );

    const bookingPreference =
      dto.bookingPreference === 'instant' ? 'INSTANT' : 'REVIEW';

    const ride = await this.prisma.ride.create({
      data: {
        /*
         * START-STADT
         */
        fromPlaceId: dto.fromPlaceId,

        fromLabel: dto.fromLabel,

        /*
         * EXAKTER STARTPUNKT
         */
        pickupPlaceId: dto.pickupPlaceId,

        pickupLabel: dto.pickupLabel,

        /*
         * ZIELSTADT
         */
        toPlaceId: dto.toPlaceId,

        toLabel: dto.toLabel,

        /*
         * EXAKTER AUSSTIEGSPUNKT
         */
        dropoffPlaceId: dto.dropoffPlaceId,

        dropoffLabel: dto.dropoffLabel,

        /*
         * DATUM + ZEIT
         */
        departureAt,

        arrivalAt,

        /*
         * FINALE ROUTE
         *
         * Die Werte beinhalten
         * inzwischen auch unsere Stops
         * und Treffpunkte.
         */
        routeDistanceMeters: dto.routeDistanceMeters,

        routeDurationSeconds: dto.routeDurationSeconds,

        /*
         * PREIS
         */
        price: dto.pricePerSeat,

        currency: dto.currency,

        /*
         * PLÄTZE
         */
        availableSeats: dto.availableSeats,

        /*
         * BUCHUNG
         */
        bookingPreference,

        /*
         * OPTIONALER KOMMENTAR
         */
        comment: dto.comment?.trim() || null,

        /*
         * TEMPORÄR:
         *
         * Wir haben noch kein
         * User/Login-System.
         */
        driverName: 'Test Driver',

        rating: null,

        /*
         * ==================================
         * ZWISCHENSTOPPS
         * ==================================
         *
         * Die Reihenfolge des Arrays
         * ist bereits die optimierte
         * Fahrreihenfolge.
         *
         * Beispiel:
         *
         * stops[0] → Position 1
         * stops[1] → Position 2
         */
        stops: {
          create: dto.stops.map((stop, index) => ({
            /*
             * Stop-Stadt
             */
            placeId: stop.placeId,

            label: stop.label,

            /*
             * Tatsächlicher
             * Treffpunkt
             */
            meetingPointPlaceId: stop.meetingPointPlaceId?.trim() || null,

            meetingPointLabel: stop.meetingPointLabel?.trim() || null,

            meetingPointAddress: stop.meetingPointAddress?.trim() || null,

            /*
             * Finale Reihenfolge
             */
            position: index + 1,
          })),
        },
      },

      /*
       * Nach dem Erstellen bekommen
       * wir die Stops direkt wieder
       * aus PostgreSQL zurück.
       */
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
   * ==================================
   * ALLE FAHRTEN
   * ==================================
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
   * ==================================
   * FAHRTEN SUCHEN
   * ==================================
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
     * Zuerst über die eindeutigen
     * Google Place IDs suchen.
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
     * Übergang für alte Testfahrten.
     *
     * Später entfernen wir diesen
     * Fallback.
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
