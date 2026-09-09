import { Injectable } from "@nestjs/common";

@Injectable()
export class LocationsService {
  autocomplete(query: string) {
    return {
      search: query,
      results: [
        {
          city: "Kiel",
          country: "Germany",
        },
      ],
    };
  }
}
