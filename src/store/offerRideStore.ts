import { create } from "zustand";

type RouteCoordinate = {
  latitude: number;
  longitude: number;
};

type Stop = {
  label: string;
  placeId: string;

  routePositionMeters: number | null;

  meetingPointLabel: string;
  meetingPointPlaceId: string;
  meetingPointAddress: string;
};

type BookingPreference = "" | "instant" | "review";

type OfferRideState = {
  fromLabel: string;
  fromPlaceId: string;

  pickupLabel: string;
  pickupPlaceId: string;

  toLabel: string;
  toPlaceId: string;

  dropoffLabel: string;
  dropoffPlaceId: string;

  selectedRouteId: string;

  routeDistanceMeters: number;
  routeDurationSeconds: number;

  routeCoordinates: RouteCoordinate[];

  stops: Stop[];

  departureDate: string;
  departureTime: string;

  availableSeats: number;

  pricePerSeat: number;
  currency: string;

  bookingPreference: BookingPreference;

  rideComment: string;

  setFrom: (label: string, placeId: string) => void;

  setPickup: (label: string, placeId: string) => void;

  setTo: (label: string, placeId: string) => void;

  setDropoff: (label: string, placeId: string) => void;

  setRouteSummary: (distanceMeters: number, durationSeconds: number) => void;

  setSelectedRoute: (
    routeId: string,
    distanceMeters: number,
    durationSeconds: number,
    coordinates: RouteCoordinate[],
  ) => void;

  addStop: (
    label: string,
    placeId: string,
    routePositionMeters?: number | null,
  ) => void;

  removeStop: (placeId: string) => void;

  clearStops: () => void;

  /*
   * Neu:
   *
   * Google gibt uns die echte
   * optimale Reihenfolge.
   */
  reorderStops: (orderedPlaceIds: string[]) => void;

  setStopMeetingPoint: (
    stopPlaceId: string,
    meetingPointLabel: string,
    meetingPointPlaceId: string,
    meetingPointAddress?: string,
  ) => void;

  setDepartureDate: (date: string) => void;

  setDepartureTime: (time: string) => void;

  setAvailableSeats: (seats: number) => void;

  setPricePerSeat: (price: number) => void;

  setCurrency: (currency: string) => void;

  setBookingPreference: (preference: BookingPreference) => void;

  setRideComment: (comment: string) => void;

  clearOffer: () => void;
};

export const useOfferRideStore = create<OfferRideState>((set) => ({
  fromLabel: "",
  fromPlaceId: "",

  pickupLabel: "",
  pickupPlaceId: "",

  toLabel: "",
  toPlaceId: "",

  dropoffLabel: "",
  dropoffPlaceId: "",

  selectedRouteId: "",

  routeDistanceMeters: 0,
  routeDurationSeconds: 0,

  routeCoordinates: [],

  stops: [],

  departureDate: "",
  departureTime: "",

  availableSeats: 1,

  pricePerSeat: 0,
  currency: "JOD",

  bookingPreference: "",

  rideComment: "",

  setFrom: (label, placeId) =>
    set({
      fromLabel: label,
      fromPlaceId: placeId,
    }),

  setPickup: (label, placeId) =>
    set({
      pickupLabel: label,

      pickupPlaceId: placeId,
    }),

  setTo: (label, placeId) =>
    set({
      toLabel: label,

      toPlaceId: placeId,
    }),

  setDropoff: (label, placeId) =>
    set({
      dropoffLabel: label,

      dropoffPlaceId: placeId,
    }),

  setRouteSummary: (distanceMeters, durationSeconds) =>
    set({
      routeDistanceMeters: distanceMeters,

      routeDurationSeconds: durationSeconds,
    }),

  setSelectedRoute: (routeId, distanceMeters, durationSeconds, coordinates) =>
    set({
      selectedRouteId: routeId,

      routeDistanceMeters: distanceMeters,

      routeDurationSeconds: durationSeconds,

      routeCoordinates: coordinates,
    }),

  addStop: (label, placeId, routePositionMeters = null) =>
    set((state) => {
      const exists = state.stops.some((stop) => stop.placeId === placeId);

      if (exists) {
        return state;
      }

      const updatedStops = [
        ...state.stops,

        {
          label,
          placeId,

          routePositionMeters,

          meetingPointLabel: "",

          meetingPointPlaceId: "",

          meetingPointAddress: "",
        },
      ];

      updatedStops.sort((a, b) => {
        if (a.routePositionMeters !== null && b.routePositionMeters !== null) {
          return a.routePositionMeters - b.routePositionMeters;
        }

        if (a.routePositionMeters === null && b.routePositionMeters !== null) {
          return 1;
        }

        if (a.routePositionMeters !== null && b.routePositionMeters === null) {
          return -1;
        }

        return 0;
      });

      return {
        stops: updatedStops,
      };
    }),

  removeStop: (placeId) =>
    set((state) => ({
      stops: state.stops.filter((stop) => stop.placeId !== placeId),
    })),

  clearStops: () =>
    set({
      stops: [],
    }),

  /*
   * Google-Reihenfolge
   * dauerhaft übernehmen.
   */
  reorderStops: (orderedPlaceIds) =>
    set((state) => {
      const stopMap = new Map(state.stops.map((stop) => [stop.placeId, stop]));

      const ordered = orderedPlaceIds
        .map((placeId) => stopMap.get(placeId))
        .filter((stop): stop is Stop => Boolean(stop));

      /*
       * Sicherheits-Fallback:
       * Falls irgendein Stop
       * nicht in Googles Antwort
       * enthalten wäre.
       */
      const remaining = state.stops.filter(
        (stop) => !orderedPlaceIds.includes(stop.placeId),
      );

      return {
        stops: [...ordered, ...remaining],
      };
    }),

  setStopMeetingPoint: (
    stopPlaceId,
    meetingPointLabel,
    meetingPointPlaceId,
    meetingPointAddress = "",
  ) =>
    set((state) => ({
      stops: state.stops.map((stop) => {
        if (stop.placeId !== stopPlaceId) {
          return stop;
        }

        return {
          ...stop,

          meetingPointLabel,

          meetingPointPlaceId,

          meetingPointAddress,
        };
      }),
    })),

  setDepartureDate: (date) =>
    set({
      departureDate: date,
    }),

  setDepartureTime: (time) =>
    set({
      departureTime: time,
    }),

  setAvailableSeats: (seats) =>
    set({
      availableSeats: seats,
    }),

  setPricePerSeat: (price) =>
    set({
      pricePerSeat: price,
    }),

  setCurrency: (currency) =>
    set({
      currency,
    }),

  setBookingPreference: (preference) =>
    set({
      bookingPreference: preference,
    }),

  setRideComment: (comment) =>
    set({
      rideComment: comment,
    }),

  clearOffer: () =>
    set({
      fromLabel: "",
      fromPlaceId: "",

      pickupLabel: "",
      pickupPlaceId: "",

      toLabel: "",
      toPlaceId: "",

      dropoffLabel: "",
      dropoffPlaceId: "",

      selectedRouteId: "",

      routeDistanceMeters: 0,

      routeDurationSeconds: 0,

      routeCoordinates: [],

      stops: [],

      departureDate: "",
      departureTime: "",

      availableSeats: 1,

      pricePerSeat: 0,
      currency: "JOD",

      bookingPreference: "",

      rideComment: "",
    }),
}));
