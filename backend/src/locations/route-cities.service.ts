import {
    BadGatewayException,
    Injectable,
    InternalServerErrorException,
} from '@nestjs/common';

import { ConfigService } from '@nestjs/config';

import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

type RouteCoordinate = {
  latitude: number;
  longitude: number;
};

type WorldCity = {
  cityId: string;

  name: string;
  country: string;

  population: number;

  loc: {
    type: 'Point';

    /*
     * GeoJSON:
     * [longitude, latitude]
     */
    coordinates: [number, number];
  };
};

const WORLD_CITIES = require('all-the-cities') as WorldCity[];

type GoogleGeocodeResult = {
  placeId?: string;

  formattedAddress?: string;

  location?: {
    latitude?: number;
    longitude?: number;
  };

  addressComponents?: {
    longText?: string;

    types?: string[];
  }[];
};

type GoogleGeocodeResponse = {
  results?: GoogleGeocodeResult[];
};

type RouteData = {
  totalDistanceMeters: number;

  segmentDistances: number[];

  cumulativeDistances: number[];
};

type Candidate = {
  name: string;
  country: string;

  population: number;

  latitude: number;
  longitude: number;

  distanceToRouteMeters: number;
  distanceFromStartMeters: number;

  score: number;
};

type SuggestionProfile = {
  minPopulation: number;

  maxSuggestions: number;

  corridorMeters: number;

  minSpacingMeters: number;

  endpointExclusionMeters: number;
};

@Injectable()
export class RouteCitiesService {
  constructor(private readonly configService: ConfigService) {}

  async findCitiesAlongRoute(
    coordinates: RouteCoordinate[],
    excludedPlaceIds: string[] = [],
  ) {
    if (coordinates.length < 2) {
      return [];
    }

    const route = this.buildRouteData(coordinates);

    const profile = this.getSuggestionProfile(route.totalDistanceMeters);

    /*
     * Erst grob über eine Bounding Box
     * filtern.
     *
     * Dadurch müssen wir nicht jede Stadt
     * der Welt vollständig gegen die Route
     * berechnen.
     */
    const bounds = this.getRouteBounds(coordinates, profile.corridorMeters);

    const candidates: Candidate[] = [];

    for (const city of WORLD_CITIES) {
      const population = Number(city.population);

      if (!Number.isFinite(population) || population < profile.minPopulation) {
        continue;
      }

      const longitude = Number(city.loc?.coordinates?.[0]);

      const latitude = Number(city.loc?.coordinates?.[1]);

      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        continue;
      }

      /*
       * Grober schneller Filter.
       */
      if (
        latitude < bounds.minLatitude ||
        latitude > bounds.maxLatitude ||
        longitude < bounds.minLongitude ||
        longitude > bounds.maxLongitude
      ) {
        continue;
      }

      /*
       * Jetzt prüfen wir exakt:
       *
       * Wie weit liegt die Stadt
       * von unserer tatsächlichen
       * Straßenroute entfernt?
       */
      const routePosition = this.findNearestRoutePosition(
        latitude,
        longitude,
        coordinates,
        route,
      );

      if (routePosition.distanceToRouteMeters > profile.corridorMeters) {
        continue;
      }

      /*
       * Startstadt und Zielstadt
       * sollen nicht als Zwischenstopp
       * vorgeschlagen werden.
       */
      if (
        routePosition.distanceFromStartMeters <
          profile.endpointExclusionMeters ||
        route.totalDistanceMeters - routePosition.distanceFromStartMeters <
          profile.endpointExclusionMeters
      ) {
        continue;
      }

      /*
       * Bewertung:
       *
       * größere Stadt = besser
       * näher an Route = besser
       *
       * Beispiel:
       *
       * Bremen direkt an der Route
       * gewinnt gegen ein kleines Dorf.
       */
      const populationScore = Math.log10(Math.max(population, 1)) * 100;

      const detourPenalty = (routePosition.distanceToRouteMeters / 1000) * 8;

      const score = populationScore - detourPenalty;

      candidates.push({
        name: city.name,

        country: city.country,

        population,

        latitude,
        longitude,

        distanceToRouteMeters: routePosition.distanceToRouteMeters,

        distanceFromStartMeters: routePosition.distanceFromStartMeters,

        score,
      });
    }

    /*
     * Erst die interessantesten Städte.
     */
    candidates.sort((a, b) => b.score - a.score);

    /*
     * Nicht mehrere Städte direkt
     * nebeneinander vorschlagen.
     *
     * Beispiel:
     * Quickborn und Norderstedt liegen
     * relativ nah zusammen.
     */
    const selected: Candidate[] = [];

    for (const candidate of candidates) {
      if (selected.length >= profile.maxSuggestions) {
        break;
      }

      const tooClose = selected.some(
        (selectedCity) =>
          Math.abs(
            selectedCity.distanceFromStartMeters -
              candidate.distanceFromStartMeters,
          ) < profile.minSpacingMeters,
      );

      if (tooClose) {
        continue;
      }

      selected.push(candidate);
    }

    /*
     * Danach wieder in Fahrtrichtung:
     *
     * Kiel
     * ↓
     * Neumünster
     * ↓
     * Bad Bramstedt
     * ↓
     * Norderstedt
     * ↓
     * Hamburg
     */
    selected.sort(
      (a, b) => a.distanceFromStartMeters - b.distanceFromStartMeters,
    );

    /*
     * Jetzt brauchen wir für unsere
     * ausgewählten Städte noch die
     * Google Place IDs.
     *
     * Wichtig:
     * Wir machen das nur für 4–8 Städte,
     * nicht mehr für jeden Punkt
     * der gesamten Route.
     */
    const resolved = await Promise.all(
      selected.map(async (candidate) => {
        try {
          const googleCity = await this.reverseGeocodeCity(
            candidate.latitude,
            candidate.longitude,
          );

          if (!googleCity) {
            return null;
          }

          return {
            ...googleCity,

            population: candidate.population,

            distanceFromStartMeters: candidate.distanceFromStartMeters,

            distanceToRouteMeters: Math.round(candidate.distanceToRouteMeters),
          };
        } catch (error) {
          console.error(`Could not resolve city ${candidate.name}:`, error);

          return null;
        }
      }),
    );

    const excluded = new Set(excludedPlaceIds.filter(Boolean));

    const unique = new Map<string, NonNullable<(typeof resolved)[number]>>();

    for (const city of resolved) {
      if (!city) {
        continue;
      }

      if (excluded.has(city.placeId)) {
        continue;
      }

      if (unique.has(city.placeId)) {
        continue;
      }

      unique.set(city.placeId, city);
    }

    const result = Array.from(unique.values()).sort(
      (a, b) => a.distanceFromStartMeters - b.distanceFromStartMeters,
    );

    if (result.length === 0 && selected.length > 0) {
      throw new BadGatewayException(
        'Could not resolve route city suggestions.',
      );
    }

    return result;
  }

  /*
   * Je länger die Fahrt,
   * desto größere Städte und
   * etwas mehr Vorschläge.
   */
  private getSuggestionProfile(routeDistanceMeters: number): SuggestionProfile {
    const kilometers = routeDistanceMeters / 1000;

    /*
     * Beispiel:
     * Kiel → Hamburg
     */
    if (kilometers <= 130) {
      return {
        minPopulation: 12000,

        maxSuggestions: 4,

        corridorMeters: 15000,

        minSpacingMeters: 12000,

        endpointExclusionMeters: 8000,
      };
    }

    if (kilometers <= 250) {
      return {
        minPopulation: 25000,

        maxSuggestions: 5,

        corridorMeters: 18000,

        minSpacingMeters: 18000,

        endpointExclusionMeters: 10000,
      };
    }

    if (kilometers <= 450) {
      return {
        minPopulation: 60000,

        maxSuggestions: 7,

        corridorMeters: 22000,

        minSpacingMeters: 18000,

        endpointExclusionMeters: 12000,
      };
    }

    /*
     * Beispiel:
     * Kiel → Mönchengladbach
     *
     * Hier interessieren uns vor allem
     * größere Städte.
     */
    return {
      minPopulation: 100000,

      maxSuggestions: 8,

      corridorMeters: 25000,

      minSpacingMeters: 15000,

      endpointExclusionMeters: 15000,
    };
  }

  private buildRouteData(coordinates: RouteCoordinate[]): RouteData {
    const segmentDistances: number[] = [];

    const cumulativeDistances: number[] = [0];

    let totalDistanceMeters = 0;

    for (let index = 0; index < coordinates.length - 1; index += 1) {
      const start = coordinates[index];

      const end = coordinates[index + 1];

      const distance = this.haversineMeters(
        start.latitude,
        start.longitude,

        end.latitude,
        end.longitude,
      );

      segmentDistances.push(distance);

      totalDistanceMeters += distance;

      cumulativeDistances.push(totalDistanceMeters);
    }

    return {
      totalDistanceMeters,

      segmentDistances,

      cumulativeDistances,
    };
  }

  /*
   * Findet:
   *
   * 1. Abstand der Stadt
   *    zur Straßenroute
   *
   * 2. Position entlang der Route
   *
   * Damit können wir später auch
   * die korrekte Reihenfolge bestimmen.
   */
  private findNearestRoutePosition(
    latitude: number,
    longitude: number,

    coordinates: RouteCoordinate[],

    route: RouteData,
  ) {
    let bestDistance = Number.POSITIVE_INFINITY;

    let bestRoutePosition = 0;

    const metersPerLatitude = 111320;

    const metersPerLongitude = 111320 * Math.cos(this.toRadians(latitude));

    for (let index = 0; index < coordinates.length - 1; index += 1) {
      const start = coordinates[index];

      const end = coordinates[index + 1];

      /*
       * Stadt wird temporär als
       * Mittelpunkt unseres kleinen
       * Koordinatensystems benutzt.
       */
      const startX = (start.longitude - longitude) * metersPerLongitude;

      const startY = (start.latitude - latitude) * metersPerLatitude;

      const endX = (end.longitude - longitude) * metersPerLongitude;

      const endY = (end.latitude - latitude) * metersPerLatitude;

      const segmentX = endX - startX;

      const segmentY = endY - startY;

      const segmentLengthSquared = segmentX * segmentX + segmentY * segmentY;

      let t = 0;

      if (segmentLengthSquared > 0) {
        t = -(startX * segmentX + startY * segmentY) / segmentLengthSquared;

        t = Math.max(0, Math.min(1, t));
      }

      const closestX = startX + segmentX * t;

      const closestY = startY + segmentY * t;

      const distance = Math.sqrt(closestX * closestX + closestY * closestY);

      if (distance < bestDistance) {
        bestDistance = distance;

        bestRoutePosition =
          route.cumulativeDistances[index] + route.segmentDistances[index] * t;
      }
    }

    return {
      distanceToRouteMeters: bestDistance,

      distanceFromStartMeters: bestRoutePosition,
    };
  }

  private getRouteBounds(
    coordinates: RouteCoordinate[],
    corridorMeters: number,
  ) {
    let minLatitude = Number.POSITIVE_INFINITY;

    let maxLatitude = Number.NEGATIVE_INFINITY;

    let minLongitude = Number.POSITIVE_INFINITY;

    let maxLongitude = Number.NEGATIVE_INFINITY;

    let latitudeSum = 0;

    for (const coordinate of coordinates) {
      minLatitude = Math.min(minLatitude, coordinate.latitude);

      maxLatitude = Math.max(maxLatitude, coordinate.latitude);

      minLongitude = Math.min(minLongitude, coordinate.longitude);

      maxLongitude = Math.max(maxLongitude, coordinate.longitude);

      latitudeSum += coordinate.latitude;
    }

    const averageLatitude = latitudeSum / coordinates.length;

    const latitudePadding = corridorMeters / 111320;

    const longitudeScale =
      111320 * Math.max(0.2, Math.cos(this.toRadians(averageLatitude)));

    const longitudePadding = corridorMeters / longitudeScale;

    return {
      minLatitude: minLatitude - latitudePadding,

      maxLatitude: maxLatitude + latitudePadding,

      minLongitude: minLongitude - longitudePadding,

      maxLongitude: maxLongitude + longitudePadding,
    };
  }

  /*
   * Aus unserer ausgewählten
   * Stadtkoordinate bekommen wir
   * die Google Place ID.
   *
   * Die brauchen wir später wieder
   * für Smart Meeting Points.
   */
  private async reverseGeocodeCity(latitude: number, longitude: number) {
    const apiKey = this.getGoogleApiKey();

    const url = new URL(
      `https://geocode.googleapis.com/v4/geocode/location/${latitude},${longitude}`,
    );

    url.searchParams.append('types', 'locality');

    url.searchParams.set('languageCode', 'en');

    const response = await fetch(url.toString(), {
      method: 'GET',

      headers: {
        'X-Goog-Api-Key': apiKey,

        'X-Goog-FieldMask': [
          'results.placeId',
          'results.formattedAddress',
          'results.location',
          'results.addressComponents',
        ].join(','),
      },
    });

    if (!response.ok) {
      const errorText = await response.text();

      console.error(
        'Google Reverse Geocoding error:',
        response.status,
        errorText,
      );

      throw new BadGatewayException('Could not resolve city.');
    }

    const data = (await response.json()) as GoogleGeocodeResponse;

    const result = data.results?.[0];

    if (!result?.placeId) {
      return null;
    }

    const locality = result.addressComponents?.find((component) =>
      component.types?.includes('locality'),
    );

    const label =
      locality?.longText ??
      result.formattedAddress?.split(',')[0]?.trim() ??
      '';

    const resultLatitude = result.location?.latitude;

    const resultLongitude = result.location?.longitude;

    if (
      !label ||
      typeof resultLatitude !== 'number' ||
      typeof resultLongitude !== 'number'
    ) {
      return null;
    }

    return {
      placeId: result.placeId,

      label,

      formattedAddress: result.formattedAddress ?? label,

      latitude: resultLatitude,

      longitude: resultLongitude,
    };
  }

  private haversineMeters(
    lat1: number,
    lon1: number,

    lat2: number,
    lon2: number,
  ) {
    const earthRadiusMeters = 6371000;

    const latitudeDelta = this.toRadians(lat2 - lat1);

    const longitudeDelta = this.toRadians(lon2 - lon1);

    const a =
      Math.sin(latitudeDelta / 2) ** 2 +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(longitudeDelta / 2) ** 2;

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return earthRadiusMeters * c;
  }

  private toRadians(value: number) {
    return (value * Math.PI) / 180;
  }

  private getGoogleApiKey() {
    const apiKey = this.configService.get<string>('GOOGLE_PLACES_API_KEY');

    if (!apiKey) {
      throw new InternalServerErrorException('Google Maps API key is missing.');
    }

    return apiKey;
  }
}
