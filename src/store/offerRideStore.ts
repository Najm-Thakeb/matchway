import { create } from "zustand";

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

  setFrom: (label: string, placeId: string) => void;

  setPickup: (label: string, placeId: string) => void;

  setTo: (label: string, placeId: string) => void;

  setDropoff: (label: string, placeId: string) => void;

  setRouteSummary: (distanceMeters: number, durationSeconds: number) => void;

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
    }),
}));
