import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class LocationsService {
  constructor(private readonly configService: ConfigService) {}

  async autocomplete(query: string) {
    if (!query || query.trim().length === 0) {
      return [];
    }

    const apiKey = this.configService.get<string>("GOOGLE_PLACES_API_KEY");

    if (!apiKey) {
      throw new InternalServerErrorException(
        "Google Places API key is missing",
      );
    }

    const response = await fetch(
      "https://places.googleapis.com/v1/places:autocomplete",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask":
            "suggestions.placePrediction.placeId,suggestions.placePrediction.structuredFormat",
        },

        body: JSON.stringify({
          input: query.trim(),
        }),
      },
    );

    if (!response.ok) {
      const error = await response.text();

      console.error("Google Places error:", response.status, error);

      throw new InternalServerErrorException("Google Places request failed");
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
        placeId: suggestion.placePrediction?.placeId ?? "",

        mainText:
          suggestion.placePrediction?.structuredFormat?.mainText?.text ?? "",

        secondaryText:
          suggestion.placePrediction?.structuredFormat?.secondaryText?.text ??
          "",
      }))
      .filter((place) => place.placeId && place.mainText);
  }
}
