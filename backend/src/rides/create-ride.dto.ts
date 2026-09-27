export type CreateRideStopDto = {
  /*
   * Stop-Stadt
   */
  placeId: string;

  label: string;

  /*
   * Tatsächlicher Treffpunkt
   * innerhalb / nahe dieser Stadt.
   */
  meetingPointPlaceId?: string;

  meetingPointLabel?: string;

  meetingPointAddress?: string;
};

export type CreateRideDto = {
  fromPlaceId: string;

  fromLabel: string;

  pickupPlaceId: string;

  pickupLabel: string;

  toPlaceId: string;

  toLabel: string;

  dropoffPlaceId: string;

  dropoffLabel: string;

  departureDate: string;

  departureTime: string;

  routeDistanceMeters: number;

  routeDurationSeconds: number;

  availableSeats: number;

  pricePerSeat: number;

  currency: string;

  bookingPreference: 'instant' | 'review';

  comment?: string;

  stops: CreateRideStopDto[];
};
