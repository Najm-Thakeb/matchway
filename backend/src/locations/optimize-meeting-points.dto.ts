export type OptimizeMeetingPointStopDto = {
  placeId: string;
  label: string;
};

export type OptimizeMeetingPointsDto = {
  originPlaceId: string;

  destinationPlaceId: string;

  stops: OptimizeMeetingPointStopDto[];
};
