import {
    BadGatewayException,
    BadRequestException,
    Controller,
    Get,
    InternalServerErrorException,
    Query,
} from '@nestjs/common';

import { ConfigService } from '@nestjs/config';

@Controller('locations')
export class PlaceDetailsController {
  constructor(private readonly configService: ConfigService) {}

  @Get('place-details')
  async placeDetails(
    @Query('placeId')
    placeId: string,
  ) {
    if (!placeId) {
      throw new BadRequestException('Place ID is required.');
    }

    const apiKey = this.configService.get<string>('GOOGLE_PLACES_API_KEY');

    if (!apiKey) {
      throw new InternalServerErrorException(
        'Google Places API key is missing.',
      );
    }

    const response = await fetch(
      `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`,
      {
        method: 'GET',

        headers: {
          'X-Goog-Api-Key': apiKey,

          'X-Goog-FieldMask': [
            'id',
            'displayName',
            'formattedAddress',
            'location',
          ].join(','),
        },
      },
    );

    if (!response.ok) {
      const errorText = await response.text();

      console.error('Google Place Details error:', response.status, errorText);

      throw new BadGatewayException('Could not load place details.');
    }

    const data = (await response.json()) as {
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

    const latitude = data.location?.latitude;

    const longitude = data.location?.longitude;

    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      throw new BadGatewayException('Place location is missing.');
    }

    return {
      placeId: data.id ?? placeId,

      label: data.displayName?.text ?? data.formattedAddress ?? '',

      address: data.formattedAddress ?? '',

      latitude,
      longitude,
    };
  }
}
