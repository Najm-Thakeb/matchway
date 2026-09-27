export type RouteCoordinateDto = {
  latitude: number;
  longitude: number;
};

export type RouteCitySuggestionsDto = {
  coordinates: RouteCoordinateDto[];

  excludedPlaceIds?: string[];
};
