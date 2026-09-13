import { BadGatewayException, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

type GoogleRoute = {
  distanceMeters?: number;
  duration?: string;
  routeLabels?: string[];

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

  async getRoute(originPlaceId: string, destinationPlaceId: string) {
    const apiKey = this.configService.get<string>("GOOGLE_PLACES_API_KEY");

    if (!apiKey) {
      throw new BadGatewayException("Google Maps API key is missing.");
    }

    const response = await fetch(
      "https://routes.googleapis.com/directions/v2:computeRoutes",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",

          "X-Goog-Api-Key": apiKey,

          "X-Goog-FieldMask": [
            "routes.distanceMeters",
            "routes.duration",
            "routes.routeLabels",
            "routes.polyline.geoJsonLinestring",
          ].join(","),
        },

        body: JSON.stringify({
          origin: {
            placeId: originPlaceId,
          },

          destination: {
            placeId: destinationPlaceId,
          },

          travelMode: "DRIVE",

          /*
            Neu:
            Google darf neben der normalen
            Route auch Alternativen liefern.
          */
          computeAlternativeRoutes: true,

          polylineQuality: "OVERVIEW",

          polylineEncoding: "GEO_JSON_LINESTRING",

          units: "METRIC",
        }),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();

      console.error("Google Routes error:", errorText);

      throw new BadGatewayException("Could not calculate route.");
    }

    const data = (await response.json()) as GoogleRoutesResponse;

    if (!data.routes || data.routes.length === 0) {
      throw new BadGatewayException("No route found.");
    }

    const routes = data.routes
      .map((route, index) => this.formatRoute(route, index))
      .filter((route) => route.coordinates.length >= 2);

    if (routes.length === 0) {
      throw new BadGatewayException("No route coordinates found.");
    }

    const primaryRoute = routes[0];

    /*
      Wir geben vorübergehend auch weiterhin
      die erste Route oben zurück.

      Dadurch funktioniert unsere aktuelle
      offer-route.tsx noch, bis wir im
      nächsten Schritt die Routenauswahl bauen.
    */
    return {
      distanceMeters: primaryRoute.distanceMeters,

      durationSeconds: primaryRoute.durationSeconds,

      coordinates: primaryRoute.coordinates,

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
            Google GeoJSON:
            [longitude, latitude]

            React Native Maps:
            { latitude, longitude }
          */
        latitude: coordinate[1],

        longitude: coordinate[0],
      }));

    const durationSeconds = Math.round(
      Number(route.duration?.replace("s", "") ?? 0),
    );

    return {
      id: `route-${index + 1}`,

      isDefault: route.routeLabels?.includes("DEFAULT_ROUTE") ?? index === 0,

      distanceMeters: route.distanceMeters ?? 0,

      durationSeconds,

      coordinates,
    };
  }
}
