export type CalculateRouteDto = {
  originPlaceId: string;

  destinationPlaceId: string;

  intermediatePlaceIds?: string[];

  /*
   * Wenn true:
   * Google darf die Stopps
   * in die sinnvollste Reihenfolge bringen.
   */
  optimizeWaypointOrder?: boolean;
};
