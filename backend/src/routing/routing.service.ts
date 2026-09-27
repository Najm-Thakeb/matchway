import { BadGatewayException, Injectable } from '@nestjs/common';

import { ConfigService } from '@nestjs/config';

type GoogleRoute = {
  distanceMeters?: number;

  duration?: string;

  routeLabels?: string[];

  optimizedIntermediateWaypointIndex?: number[];

  polyline?: {
    geoJsonLinestring?: {
      coordinates?: number[][];
    };
  };
};

type GoogleRoutesResponse = {
  routes?: GoogleRoute[];
};

@Injectable()
export class RoutingService {
  constructor(private readonly configService: ConfigService) {}

  async getRoute(
    originPlaceId: string,
    destinationPlaceId: string,
    intermediatePlaceIds: string[] = [],
    optimizeWaypointOrder = false,
  ) {
    const apiKey = this.configService.get<string>('GOOGLE_PLACES_API_KEY');

    if (!apiKey) {
      throw new BadGatewayException('Google Maps API key is missing.');
    }

    const hasIntermediateStops = intermediatePlaceIds.length > 0;

    /*
     * Bei nur einem Stop gibt es
     * nichts zu sortieren.
     */
    const shouldOptimize =
      optimizeWaypointOrder && intermediatePlaceIds.length > 1;

    const intermediates = intermediatePlaceIds.map((placeId) => ({
      placeId,
    }));

    const requestBody: {
      origin: {
        placeId: string;
      };

      destination: {
        placeId: string;
      };

      intermediates?: {
        placeId: string;
      }[];

      travelMode: string;

      computeAlternativeRoutes: boolean;

      optimizeWaypointOrder?: boolean;

      polylineQuality: string;

      polylineEncoding: string;

      units: string;
    } = {
      origin: {
        placeId: originPlaceId,
      },

      destination: {
        placeId: destinationPlaceId,
      },

      travelMode: 'DRIVE',

      /*
       * Google erlaubt bei normalen
       * Start/Ziel-Routen Alternativen.
       *
       * Bei Zwischenstopps brauchen
       * wir dagegen genau eine Route.
       */
      computeAlternativeRoutes: !hasIntermediateStops,

      polylineQuality: 'OVERVIEW',

      polylineEncoding: 'GEO_JSON_LINESTRING',

      units: 'METRIC',
    };

    if (hasIntermediateStops) {
      requestBody.intermediates = intermediates;
    }

    if (shouldOptimize) {
      requestBody.optimizeWaypointOrder = true;
    }

    const response = await fetch(
      'https://routes.googleapis.com/directions/v2:computeRoutes',
      {
        method: 'POST',

        headers: {
          'Content-Type': 'application/json',

          'X-Goog-Api-Key': apiKey,

          /*
           * Ganz wichtig:
           *
           * Google gibt uns hier
           * zusätzlich die neue
           * Stop-Reihenfolge zurück.
           */
          'X-Goog-FieldMask': [
            'routes.distanceMeters',
            'routes.duration',
            'routes.routeLabels',
            'routes.polyline.geoJsonLinestring',
            'routes.optimizedIntermediateWaypointIndex',
          ].join(','),
        },

        body: JSON.stringify(requestBody),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();

      console.error('Google Routes error:', response.status, errorText);

      throw new BadGatewayException('Could not calculate route.');
    }

    const data = (await response.json()) as GoogleRoutesResponse;

    if (!data.routes || data.routes.length === 0) {
      throw new BadGatewayException('No route found.');
    }

    const routes = data.routes
      .map((route, index) => this.formatRoute(route, index))
      .filter((route) => route.coordinates.length >= 2);

    if (routes.length === 0) {
      throw new BadGatewayException('No route coordinates found.');
    }

    const primaryRoute = routes[0];

    return {
      distanceMeters: primaryRoute.distanceMeters,

      durationSeconds: primaryRoute.durationSeconds,

      coordinates: primaryRoute.coordinates,

      /*
       * Beispiel:
       *
       * Eingabe:
       * [Neumünster, Lübeck]
       *
       * Google:
       * [1, 0]
       *
       * Bedeutet:
       * Lübeck → Neumünster
       */
      optimizedIntermediateWaypointIndex:
        primaryRoute.optimizedIntermediateWaypointIndex,

      routes,
    };
  }

  private formatRoute(route: GoogleRoute, index: number) {
    const googleCoordinates =
      route.polyline?.geoJsonLinestring?.coordinates ?? [];

    const coordinates = googleCoordinates
      .filter((coordinate) => coordinate.length >= 2)
      .map((coordinate) => ({
        /*
         * Google:
         * [longitude, latitude]
         *
         * React Native:
         * { latitude, longitude }
         */
        latitude: coordinate[1],

        longitude: coordinate[0],
      }));

    const durationSeconds = Math.round(
      Number(route.duration?.replace('s', '') ?? 0),
    );

    return {
      id: `route-${index + 1}`,

      isDefault: route.routeLabels?.includes('DEFAULT_ROUTE') ?? index === 0,

      distanceMeters: route.distanceMeters ?? 0,

      durationSeconds,

      coordinates,

      optimizedIntermediateWaypointIndex:
        route.optimizedIntermediateWaypointIndex ?? [],
    };
  }
}
