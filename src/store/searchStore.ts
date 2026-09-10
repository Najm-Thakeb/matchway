import { create } from "zustand";

type SearchState = {
  fromLabel: string;
  fromPlaceId: string;

  toLabel: string;
  toPlaceId: string;

  departureDate: string;
  returnDate: string;

  passengers: number;

  setFrom: (label: string, placeId: string) => void;
  setTo: (label: string, placeId: string) => void;

  setDepartureDate: (date: string) => void;
  setReturnDate: (date: string) => void;
  clearReturnDate: () => void;

  setPassengers: (passengers: number) => void;

  swapLocations: () => void;
};

export const useSearchStore = create<SearchState>((set) => ({
  fromLabel: "",
  fromPlaceId: "",

  toLabel: "",
  toPlaceId: "",

  departureDate: "",
  returnDate: "",

  passengers: 1,

  setFrom: (label, placeId) =>
    set({
      fromLabel: label,
      fromPlaceId: placeId,
    }),

  setTo: (label, placeId) =>
    set({
      toLabel: label,
      toPlaceId: placeId,
    }),

  setDepartureDate: (date) =>
    set({
      departureDate: date,
    }),

  setReturnDate: (date) =>
    set({
      returnDate: date,
    }),

  clearReturnDate: () =>
    set({
      returnDate: "",
    }),

  setPassengers: (passengers) =>
    set({
      passengers,
    }),

  swapLocations: () =>
    set((state) => ({
      fromLabel: state.toLabel,
      fromPlaceId: state.toPlaceId,
      toLabel: state.fromLabel,
      toPlaceId: state.fromPlaceId,
    })),
}));
