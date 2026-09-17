import { create } from "zustand";

type Stop = {
  label: string;
  placeId: string;
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

  routeDistanceMeters: number;
  routeDurationSeconds: number;

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

  addStop: (label: string, placeId: string) => void;

  removeStop: (placeId: string) => void;

  clearStops: () => void;

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

  routeDistanceMeters: 0,
  routeDurationSeconds: 0,

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

  addStop: (label, placeId) =>
    set((state) => ({
      stops: [
        ...state.stops,
        {
          label,
          placeId,
        },
      ],
    })),

  removeStop: (placeId) =>
    set((state) => ({
      stops: state.stops.filter((stop) => stop.placeId !== placeId),
    })),

  clearStops: () =>
    set({
      stops: [],
    }),

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

      routeDistanceMeters: 0,
      routeDurationSeconds: 0,

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
