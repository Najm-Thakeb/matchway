import {
  BadGatewayException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';

import { ConfigService } from '@nestjs/config';

import { RoutingService } from '../routing/routing.service.js';

type PlaceSuggestion = {
  placeId: string;
  mainText: string;
  secondaryText: string;
};

type GooglePlaceDetails = {
  id?: string;

  displayName?: {
    text?: string;
  };

  formattedAddress?: string;

  location?: {
    latitude?: number;
    longitude?: number;
  };
};

type GoogleNearbyPlace = {
  id?: string;

  displayName?: {
    text?: string;
  };

  formattedAddress?: string;

  location?: {
    latitude?: number;
    longitude?: number;
  };

  primaryType?: string;

  types?: string[];
};

type GoogleNearbyResponse = {
  places?: GoogleNearbyPlace[];
};

type NearbySearchGroup = {
  types: string[];

  maxResultCount: number;
};

type MeetingPointCandidate = {
  placeId: string;

  label: string;
  address: string;

  latitude: number;
  longitude: number;

  primaryType: string;

  types: string[];
};

type OptimizeStop = {
  placeId: string;
  label: string;
};

type RouteCoordinate = {
  latitude: number;
  longitude: number;
};

type EvaluatedCandidate = {
  candidate: MeetingPointCandidate;

  distanceFromReferenceRouteMeters: number;

  durationSeconds: number;
  distanceMeters: number;

  typePenaltySeconds: number;

  scoreSeconds: number;

  route: any;
};

@Injectable()
export class LocationsService {
  constructor(
    private readonly configService: ConfigService,

    /*
     * Neu:
     * Locations kann jetzt echte
     * Fahrtrouten berechnen.
     */
    private readonly routingService: RoutingService,
  ) {}

  async autocomplete(query: string): Promise<PlaceSuggestion[]> {
    if (!query || query.trim().length === 0) {
      return [];
    }

    const apiKey = this.getGoogleApiKey();

    const response = await fetch(
      'https://places.googleapis.com/v1/places:autocomplete',
      {
        method: 'POST',

        headers: {
          'Content-Type': 'application/json',

          'X-Goog-Api-Key': apiKey,

          'X-Goog-FieldMask':
            'suggestions.placePrediction.placeId,suggestions.placePrediction.structuredFormat',
        },

        body: JSON.stringify({
          input: query.trim(),
        }),
      },
    );

    if (!response.ok) {
      const error = await response.text();

      console.error(
        'Google Places autocomplete error:',
        response.status,
        error,
      );

      throw new InternalServerErrorException('Google Places request failed');
    }

    const data = (await response.json()) as {
      suggestions?: {
        placePrediction?: {
          placeId?: string;

          structuredFormat?: {
            mainText?: {
              text?: string;
            };

            secondaryText?: {
              text?: string;
            };
          };
        };
      }[];
    };

    return (data.suggestions ?? [])
      .map((suggestion) => ({
        placeId: suggestion.placePrediction?.placeId ?? '',

        mainText:
          suggestion.placePrediction?.structuredFormat?.mainText?.text ?? '',

        secondaryText:
          suggestion.placePrediction?.structuredFormat?.secondaryText?.text ??
          '',
      }))
      .filter((place) => place.placeId && place.mainText);
  }

  /*
   * Liefert mögliche Treffpunkte
   * rund um eine Stop-Stadt.
   */
  async findMeetingPointCandidates(
    stopPlaceId: string,
  ): Promise<MeetingPointCandidate[]> {
    const apiKey = this.getGoogleApiKey();

    const stopDetails = await this.getPlaceDetails(stopPlaceId, apiKey);

    const latitude = stopDetails.location?.latitude;

    const longitude = stopDetails.location?.longitude;

    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      throw new BadGatewayException('Could not determine stop location.');
    }

    /*
     * Mehrere Gruppen verhindern,
     * dass normale Innenstadt-Parkplätze
     * alle anderen Treffpunkt-Arten
     * verdrängen.
     */
    const searchGroups: NearbySearchGroup[] = [
      {
        types: ['park_and_ride', 'rest_stop', 'truck_stop'],

        maxResultCount: 5,
      },

      {
        types: ['gas_station'],

        maxResultCount: 5,
      },

      {
        types: ['train_station'],

        maxResultCount: 3,
      },

      {
        types: ['parking', 'parking_lot', 'parking_garage'],

        maxResultCount: 7,
      },
    ];

    const groupedResults = await Promise.all(
      searchGroups.map((group) =>
        this.searchNearbyPlaces(
          latitude,
          longitude,
          group.types,
          group.maxResultCount,
          apiKey,
        ),
      ),
    );

    const allPlaces = groupedResults.flat();

    /*
     * Doppelte Google Places entfernen.
     */
    const uniquePlaces = new Map<string, GoogleNearbyPlace>();

    for (const place of allPlaces) {
      if (!place.id) {
        continue;
      }

      if (!uniquePlaces.has(place.id)) {
        uniquePlaces.set(place.id, place);
      }
    }

    return Array.from(uniquePlaces.values())
      .map((place) => ({
        placeId: place.id ?? '',

        label: place.displayName?.text ?? '',

        address: place.formattedAddress ?? '',

        latitude: place.location?.latitude ?? NaN,

        longitude: place.location?.longitude ?? NaN,

        primaryType: place.primaryType ?? '',

        types: place.types ?? [],
      }))
      .filter(
        (place) =>
          place.placeId &&
          place.label &&
          Number.isFinite(place.latitude) &&
          Number.isFinite(place.longitude),
      );
  }

  /*
   * =====================================================
   * MATCHWAY SMART MEETING POINT
   * =====================================================
   *
   * Beispiel:
   *
   * Kiel
   * ↓
   * Neumünster
   * ↓
   * Hamburg
   *
   * Fahrer gibt nur "Neumünster" ein.
   *
   * MatchWay:
   *
   * 1. findet Treffpunkte
   * 2. prüft Nähe zur Route
   * 3. berechnet echte Fahrten
   * 4. wählt den besten Treffpunkt
   */
  async optimizeMeetingPoints(
    originPlaceId: string,
    destinationPlaceId: string,
    stops: OptimizeStop[],
  ) {
    /*
     * Keine Stops:
     * normale direkte Route.
     */
    if (stops.length === 0) {
      const route = await this.routingService.getRoute(
        originPlaceId,
        destinationPlaceId,
        [],
      );

      return {
        meetingPoints: [],
        route,
      };
    }

    /*
     * Am Anfang stehen hier noch
     * die vom Fahrer ausgewählten Städte.
     *
     * Beispiel:
     *
     * [Neumünster]
     *
     * Nach der Optimierung:
     *
     * [A7 Raststätte / P+R / Tankstelle]
     */
    const intermediates = stops.map((stop) => stop.placeId);

    const meetingPoints: {
      stopPlaceId: string;
      stopLabel: string;

      meetingPointPlaceId: string;
      meetingPointLabel: string;
      meetingPointAddress: string;

      primaryType: string;

      extraDurationSeconds: number;
      extraDistanceMeters: number;

      fallback: boolean;
    }[] = [];

    for (let stopIndex = 0; stopIndex < stops.length; stopIndex += 1) {
      const stop = stops[stopIndex];

      /*
       * SEHR WICHTIG:
       *
       * Für die Referenz entfernen wir
       * genau den Stop, den wir gerade
       * optimieren.
       *
       * Beispiel:
       *
       * Fahrer:
       * Kiel → Hamburg
       *
       * Stop:
       * Neumünster
       *
       * Referenz:
       * Kiel → Hamburg
       *
       * NICHT:
       * Kiel → Neumünster Zentrum → Hamburg
       */
      const baselineIntermediates = intermediates.filter(
        (_, index) => index !== stopIndex,
      );

      const baselineRoute = await this.routingService.getRoute(
        originPlaceId,
        destinationPlaceId,
        baselineIntermediates,
      );

      const baselineCoordinates =
        baselineRoute.coordinates as RouteCoordinate[];

      /*
       * Mögliche Treffpunkte in/nahe
       * der Stop-Stadt laden.
       */
      const candidates = await this.findMeetingPointCandidates(stop.placeId);

      if (candidates.length === 0) {
        meetingPoints.push({
          stopPlaceId: stop.placeId,

          stopLabel: stop.label,

          meetingPointPlaceId: '',

          meetingPointLabel: '',

          meetingPointAddress: '',

          primaryType: '',

          extraDurationSeconds: 0,

          extraDistanceMeters: 0,

          fallback: true,
        });

        continue;
      }

      /*
       * Zuerst günstig filtern:
       *
       * Welcher Kandidat liegt überhaupt
       * nahe an der Route, die der Fahrer
       * OHNE diesen Stop fahren würde?
       */
      const candidatesWithDistance = candidates.map((candidate) => ({
        candidate,

        distanceFromReferenceRouteMeters: this.distancePointToRouteMeters(
          candidate.latitude,
          candidate.longitude,
          baselineCoordinates,
        ),
      }));

      /*
       * Nur die 6 Kandidaten,
       * die am nächsten zur echten
       * Fahrerroute liegen.
       */
      const shortlisted = candidatesWithDistance
        .sort(
          (a, b) =>
            a.distanceFromReferenceRouteMeters -
            b.distanceFromReferenceRouteMeters,
        )
        .slice(0, 6);

      const evaluated = await Promise.all(
        shortlisted.map(
          async (shortlistedCandidate): Promise<EvaluatedCandidate | null> => {
            const candidate = shortlistedCandidate.candidate;

            /*
             * Den Stadt-Stop testweise
             * durch diesen konkreten
             * Treffpunkt ersetzen.
             */
            const testIntermediates = [...intermediates];

            testIntermediates[stopIndex] = candidate.placeId;

            try {
              const route = await this.routingService.getRoute(
                originPlaceId,
                destinationPlaceId,
                testIntermediates,
              );

              /*
               * Der echte zusätzliche
               * Zeitaufwand gegenüber
               * der Fahrt OHNE diesen Stop.
               */
              const extraDurationSeconds = Math.max(
                0,
                route.durationSeconds - baselineRoute.durationSeconds,
              );

              /*
               * Kleine Qualitätsgewichtung:
               *
               * P+R besser als Parkhaus usw.
               *
               * Aber die echte Fahrzeit
               * bleibt entscheidend.
               */
              const typePenaltySeconds =
                this.getMeetingPointTypePenaltySeconds(candidate);

              const scoreSeconds = extraDurationSeconds + typePenaltySeconds;

              return {
                candidate,

                distanceFromReferenceRouteMeters:
                  shortlistedCandidate.distanceFromReferenceRouteMeters,

                durationSeconds: route.durationSeconds,

                distanceMeters: route.distanceMeters,

                typePenaltySeconds,

                scoreSeconds,

                route,
              };
            } catch {
              console.warn(
                `Meeting point candidate failed: ${candidate.label}`,
              );

              return null;
            }
          },
        ),
      );

      const validCandidates = evaluated.filter(
        (candidate): candidate is EvaluatedCandidate => candidate !== null,
      );

      if (validCandidates.length === 0) {
        meetingPoints.push({
          stopPlaceId: stop.placeId,

          stopLabel: stop.label,

          meetingPointPlaceId: '',

          meetingPointLabel: '',

          meetingPointAddress: '',

          primaryType: '',

          extraDurationSeconds: 0,

          extraDistanceMeters: 0,

          fallback: true,
        });

        continue;
      }

      /*
       * Kleinster Score gewinnt.
       */
      validCandidates.sort((a, b) => a.scoreSeconds - b.scoreSeconds);

      const best = validCandidates[0];

      /*
       * Jetzt vergleichen wir korrekt
       * gegen die Route OHNE diesen Stop.
       */
      const extraDurationSeconds = Math.max(
        0,
        best.durationSeconds - baselineRoute.durationSeconds,
      );

      const extraDistanceMeters = Math.max(
        0,
        best.distanceMeters - baselineRoute.distanceMeters,
      );

      /*
       * Stadt wird dauerhaft durch
       * den ausgewählten Treffpunkt ersetzt.
       */
      intermediates[stopIndex] = best.candidate.placeId;

      meetingPoints.push({
        stopPlaceId: stop.placeId,

        stopLabel: stop.label,

        meetingPointPlaceId: best.candidate.placeId,

        meetingPointLabel: best.candidate.label,

        meetingPointAddress: best.candidate.address,

        primaryType: best.candidate.primaryType,

        extraDurationSeconds,

        extraDistanceMeters,

        fallback: false,
      });
    }

    /*
     * Finale Route mit allen
     * automatisch gewählten Treffpunkten.
     */
    const finalRoute = await this.routingService.getRoute(
      originPlaceId,
      destinationPlaceId,
      intermediates,
    );

    return {
      meetingPoints,
      route: finalRoute,
    };
  }

  /*
   * Treffpunkt-Art bekommt einen
   * kleinen Zeitaufschlag.
   *
   * Klein = bevorzugt.
   *
   * Das ist KEIN echter Fahrzeitaufschlag.
   * Es ist nur unser internes Ranking.
   */
  private getMeetingPointTypePenaltySeconds(candidate: MeetingPointCandidate) {
    switch (candidate.primaryType) {
      case 'park_and_ride':
        return 0;

      case 'truck_stop':
        return 30;

      case 'gas_station':
        return 60;

      case 'rest_stop': {
        /*
         * Google bezeichnet manchmal auch
         * einfache Schutzhütten als rest_stop.
         *
         * Ein Rastplatz mit Gastronomie /
         * Store ist für MatchWay sinnvoller.
         */
        const usefulRestStop = candidate.types.some(
          (type) =>
            type === 'cafe' ||
            type === 'restaurant' ||
            type === 'food' ||
            type === 'store' ||
            type === 'gas_station',
        );

        return usefulRestStop ? 45 : 240;
      }

      case 'parking_lot':
        return 90;

      case 'train_station':
        return 120;

      case 'parking':
        return 120;

      case 'parking_garage':
        return 180;

      default:
        return 240;
    }
  }

  /*
   * Entfernung eines Treffpunktes
   * zur tatsächlichen Routenlinie.
   *
   * Nicht nur zum nächsten Polyline-Punkt,
   * sondern zum nächsten Liniensegment.
   */
  private distancePointToRouteMeters(
    latitude: number,
    longitude: number,
    route: RouteCoordinate[],
  ) {
    if (route.length === 0) {
      return Number.POSITIVE_INFINITY;
    }

    if (route.length === 1) {
      return this.haversineMeters(
        latitude,
        longitude,
        route[0].latitude,
        route[0].longitude,
      );
    }

    let minimumDistance = Number.POSITIVE_INFINITY;

    for (let index = 0; index < route.length - 1; index += 1) {
      const start = route[index];

      const end = route[index + 1];

      const distance = this.distancePointToSegmentMeters(
        latitude,
        longitude,
        start.latitude,
        start.longitude,
        end.latitude,
        end.longitude,
      );

      if (distance < minimumDistance) {
        minimumDistance = distance;
      }
    }

    return minimumDistance;
  }

  /*
   * Punkt → Liniensegment in Metern.
   *
   * Für lokale Distanzen projizieren
   * wir Latitude/Longitude auf ein
   * einfaches Meter-Koordinatensystem.
   */
  private distancePointToSegmentMeters(
    pointLat: number,
    pointLon: number,

    startLat: number,
    startLon: number,

    endLat: number,
    endLon: number,
  ) {
    const latitudeRadians = (pointLat * Math.PI) / 180;

    const metersPerDegreeLon = 111320 * Math.cos(latitudeRadians);

    const metersPerDegreeLat = 110540;

    /*
     * Der zu prüfende Punkt
     * wird unser Ursprung 0/0.
     */
    const startX = (startLon - pointLon) * metersPerDegreeLon;

    const startY = (startLat - pointLat) * metersPerDegreeLat;

    const endX = (endLon - pointLon) * metersPerDegreeLon;

    const endY = (endLat - pointLat) * metersPerDegreeLat;

    const segmentX = endX - startX;

    const segmentY = endY - startY;

    const segmentLengthSquared = segmentX * segmentX + segmentY * segmentY;

    if (segmentLengthSquared === 0) {
      return Math.sqrt(startX * startX + startY * startY);
    }

    /*
     * Projektion des Punktes
     * auf das Segment.
     */
    const projection = Math.max(
      0,
      Math.min(
        1,
        -(startX * segmentX + startY * segmentY) / segmentLengthSquared,
      ),
    );

    const nearestX = startX + projection * segmentX;

    const nearestY = startY + projection * segmentY;

    return Math.sqrt(nearestX * nearestX + nearestY * nearestY);
  }

  private haversineMeters(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ) {
    const earthRadiusMeters = 6371000;

    const toRadians = (value: number) => (value * Math.PI) / 180;

    const latitudeDelta = toRadians(lat2 - lat1);

    const longitudeDelta = toRadians(lon2 - lon1);

    const a =
      Math.sin(latitudeDelta / 2) ** 2 +
      Math.cos(toRadians(lat1)) *
        Math.cos(toRadians(lat2)) *
        Math.sin(longitudeDelta / 2) ** 2;

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return earthRadiusMeters * c;
  }

  private async searchNearbyPlaces(
    latitude: number,
    longitude: number,

    includedPrimaryTypes: string[],

    maxResultCount: number,

    apiKey: string,
  ): Promise<GoogleNearbyPlace[]> {
    const response = await fetch(
      'https://places.googleapis.com/v1/places:searchNearby',
      {
        method: 'POST',

        headers: {
          'Content-Type': 'application/json',

          'X-Goog-Api-Key': apiKey,

          'X-Goog-FieldMask': [
            'places.id',
            'places.displayName',
            'places.formattedAddress',
            'places.location',
            'places.primaryType',
            'places.types',
          ].join(','),
        },

        body: JSON.stringify({
          includedPrimaryTypes,

          maxResultCount,

          rankPreference: 'DISTANCE',

          locationRestriction: {
            circle: {
              center: {
                latitude,
                longitude,
              },

              radius: 10000,
            },
          },
        }),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();

      console.error('Google Nearby Search error:', response.status, errorText);

      throw new BadGatewayException('Could not find meeting points.');
    }

    const data = (await response.json()) as GoogleNearbyResponse;

    return data.places ?? [];
  }

  private async getPlaceDetails(
    placeId: string,
    apiKey: string,
  ): Promise<GooglePlaceDetails> {
    const response = await fetch(
      `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`,
      {
        method: 'GET',

        headers: {
          'Content-Type': 'application/json',

          'X-Goog-Api-Key': apiKey,

          'X-Goog-FieldMask': 'id,displayName,formattedAddress,location',
        },
      },
    );

    if (!response.ok) {
      const errorText = await response.text();

      console.error('Google Place Details error:', response.status, errorText);

      throw new BadGatewayException('Could not load stop details.');
    }

    return (await response.json()) as GooglePlaceDetails;
  }

  private getGoogleApiKey() {
    const apiKey = this.configService.get<string>('GOOGLE_PLACES_API_KEY');

    if (!apiKey) {
      throw new InternalServerErrorException(
        'Google Places API key is missing',
      );
    }

    return apiKey;
  }
}
