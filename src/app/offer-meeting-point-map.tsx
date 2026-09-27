import { useEffect, useRef, useState } from "react";

import {
    ActivityIndicator,
    Alert,
    Keyboard,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

import { router, useLocalSearchParams } from "expo-router";

import { SafeAreaView } from "react-native-safe-area-context";

import Ionicons from "@expo/vector-icons/Ionicons";

import MapView, { Marker, Polyline } from "react-native-maps";

import { useOfferRideStore } from "../store/offerRideStore";

const MATCHWAY_RED = "#E63946";

type PlaceSuggestion = {
  placeId: string;
  mainText: string;
  secondaryText: string;
};

type PlaceDetails = {
  placeId: string;

  label: string;
  address: string;

  latitude: number;
  longitude: number;
};

type RouteCoordinate = {
  latitude: number;
  longitude: number;
};

type RouteResponse = {
  distanceMeters: number;

  durationSeconds: number;

  coordinates: RouteCoordinate[];
};

type StopMarker = {
  stopPlaceId: string;

  placeId: string;

  label: string;
  address: string;

  latitude: number;
  longitude: number;
};

export default function OfferMeetingPointMapScreen() {
  const params = useLocalSearchParams<{
    stopPlaceId?: string;
  }>();

  const rawStopPlaceId = params.stopPlaceId;

  const stopPlaceId = Array.isArray(rawStopPlaceId)
    ? rawStopPlaceId[0]
    : (rawStopPlaceId ?? "");

  const mapRef = useRef<MapView>(null);

  const {
    stops,

    routeCoordinates,

    selectedRouteId,

    pickupLabel,
    pickupPlaceId,

    dropoffLabel,
    dropoffPlaceId,

    setStopMeetingPoint,

    setSelectedRoute,
  } = useOfferRideStore();

  const stop = stops.find((item) => item.placeId === stopPlaceId);

  const [query, setQuery] = useState("");

  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);

  const [selectedPlace, setSelectedPlace] = useState<PlaceDetails | null>(null);

  /*
   * Linie, die gerade auf
   * der Karte sichtbar ist.
   */
  const [displayRoute, setDisplayRoute] =
    useState<RouteCoordinate[]>(routeCoordinates);

  /*
   * Alle Stop-Punkte auf
   * der Karte.
   */
  const [stopMarkers, setStopMarkers] = useState<StopMarker[]>([]);

  const [loading, setLoading] = useState(true);

  const [searchLoading, setSearchLoading] = useState(false);

  const [saving, setSaving] = useState(false);

  const stopsKey = stops
    .map((item) => `${item.placeId}:${item.meetingPointPlaceId}`)
    .join("|");

  useEffect(() => {
    if (!stop) {
      setLoading(false);

      return;
    }

    const initialPlaceId = stop.meetingPointPlaceId || stop.placeId;

    loadInitialData(initialPlaceId);
  }, [stopPlaceId]);

  /*
   * Wenn andere Meeting Points
   * geändert wurden:
   * Marker neu laden.
   */
  useEffect(() => {
    loadAllStopMarkers();
  }, [stopsKey]);

  /*
   * Store bekommt nach jeder
   * Routenneuberechnung eine
   * neue komplette Linie.
   */
  useEffect(() => {
    if (routeCoordinates.length > 1) {
      setDisplayRoute(routeCoordinates);
    }
  }, [routeCoordinates]);

  /*
   * Karte zeigt immer die
   * komplette Fahrt:
   *
   * Start
   * → Stop 1
   * → Stop 2
   * → Ziel
   */
  useEffect(() => {
    if (displayRoute.length < 2) {
      return;
    }

    const timeout = setTimeout(() => {
      mapRef.current?.fitToCoordinates(displayRoute, {
        edgePadding: {
          top: 50,
          right: 40,
          bottom: 50,
          left: 40,
        },

        animated: true,
      });
    }, 250);

    return () => clearTimeout(timeout);
  }, [displayRoute]);

  /*
   * Suchvorschläge.
   *
   * Wir ergänzen automatisch
   * die Stop-Stadt.
   *
   * Beispiel:
   *
   * User schreibt:
   * Hauptbahnhof
   *
   * Google bekommt:
   * Hauptbahnhof Neumünster
   */
  useEffect(() => {
    const searchText = query.trim();

    if (searchText.length < 2) {
      setSuggestions([]);

      setSearchLoading(false);

      return;
    }

    const timeout = setTimeout(async () => {
      try {
        setSearchLoading(true);

        const cityName = stop?.label.split(",")[0].trim() ?? "";

        const completeQuery = cityName
          ? `${searchText} ${cityName}`
          : searchText;

        const response = await fetch(
          `http://localhost:3000/locations/autocomplete?q=${encodeURIComponent(
            completeQuery,
          )}`,
        );

        if (!response.ok) {
          throw new Error("Search failed");
        }

        const data: PlaceSuggestion[] = await response.json();

        setSuggestions(data);
      } catch (error) {
        console.error("Meeting point search error:", error);

        setSuggestions([]);
      } finally {
        setSearchLoading(false);
      }
    }, 350);

    return () => clearTimeout(timeout);
  }, [query, stopPlaceId]);

  async function loadInitialData(placeId: string) {
    try {
      setLoading(true);

      const details = await getPlaceDetails(placeId);

      setSelectedPlace(details);

      await loadAllStopMarkers();
    } catch (error) {
      console.error("Initial meeting point error:", error);

      Alert.alert(
        "Location unavailable",
        "We couldn't load this meeting point.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function getPlaceDetails(placeId: string) {
    const response = await fetch(
      `http://localhost:3000/locations/place-details?placeId=${encodeURIComponent(
        placeId,
      )}`,
    );

    if (!response.ok) {
      throw new Error("Place details failed");
    }

    return (await response.json()) as PlaceDetails;
  }

  async function loadAllStopMarkers() {
    try {
      const markerResults = await Promise.all(
        stops.map(async (currentStop) => {
          const placeId =
            currentStop.meetingPointPlaceId || currentStop.placeId;

          try {
            const details = await getPlaceDetails(placeId);

            return {
              stopPlaceId: currentStop.placeId,

              placeId: details.placeId,

              label: details.label,

              address: details.address,

              latitude: details.latitude,

              longitude: details.longitude,
            };
          } catch {
            return null;
          }
        }),
      );

      setStopMarkers(
        markerResults.filter((marker): marker is StopMarker => marker !== null),
      );
    } catch (error) {
      console.error("Stop markers error:", error);
    }
  }

  /*
   * Berechnet eine Route mit
   * einem neuen Treffpunkt,
   * ohne ihn schon zu speichern.
   */
  async function calculateRouteWithPlace(place: PlaceDetails) {
    const intermediatePlaceIds = stops.map((currentStop) => {
      if (currentStop.placeId === stopPlaceId) {
        return place.placeId;
      }

      return currentStop.meetingPointPlaceId || currentStop.placeId;
    });

    const response = await fetch("http://localhost:3000/routing", {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        originPlaceId: pickupPlaceId,

        destinationPlaceId: dropoffPlaceId,

        intermediatePlaceIds,

        /*
         * Reihenfolge wurde bereits
         * vorher optimiert.
         */
        optimizeWaypointOrder: false,
      }),
    });

    if (!response.ok) {
      throw new Error("Route calculation failed");
    }

    return (await response.json()) as RouteResponse;
  }

  async function chooseSuggestion(suggestion: PlaceSuggestion) {
    Keyboard.dismiss();

    setSuggestions([]);

    setQuery(suggestion.mainText);

    try {
      setSearchLoading(true);

      const details = await getPlaceDetails(suggestion.placeId);

      /*
       * Neue Adresse auswählen.
       */
      setSelectedPlace(details);

      /*
       * Sofort neue echte Linie
       * als Vorschau berechnen.
       */
      const route = await calculateRouteWithPlace(details);

      setDisplayRoute(route.coordinates);
    } catch (error) {
      console.error("Meeting point selection error:", error);

      Alert.alert("Location unavailable", "We couldn't use this address.");
    } finally {
      setSearchLoading(false);
    }
  }

  async function saveMeetingPoint() {
    if (!stop || !selectedPlace || !pickupPlaceId || !dropoffPlaceId) {
      return;
    }

    try {
      setSaving(true);

      /*
       * Noch einmal endgültig
       * berechnen.
       */
      const route = await calculateRouteWithPlace(selectedPlace);

      setStopMeetingPoint(
        stop.placeId,

        selectedPlace.label,

        selectedPlace.placeId,

        selectedPlace.address,
      );

      /*
       * Diese echte Route wird
       * jetzt global gespeichert.
       */
      setSelectedRoute(
        selectedRouteId,

        route.distanceMeters,

        route.durationSeconds,

        route.coordinates,
      );

      router.back();
    } catch (error) {
      console.error("Save meeting point error:", error);

      Alert.alert(
        "Meeting point unavailable",
        "This meeting point couldn't be used for the route.",
      );
    } finally {
      setSaving(false);
    }
  }

  const startCoordinate = displayRoute[0];

  const endCoordinate = displayRoute[displayRoute.length - 1];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={25} color="#111827" />
        </TouchableOpacity>

        <View style={styles.headerText}>
          <Text style={styles.title}>Meeting point</Text>

          <Text style={styles.subtitle}>{stop?.label.split(",")[0] ?? ""}</Text>
        </View>
      </View>

      {/* SEARCH */}
      <View style={styles.searchSection}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={21} color="#667085" />

          <TextInput
            style={styles.input}
            value={query}
            onChangeText={setQuery}
            placeholder={
              stop
                ? `Search in ${stop.label.split(",")[0]}...`
                : "Search address..."
            }
            placeholderTextColor="#98A2B3"
            autoCorrect={false}
          />

          {searchLoading ? (
            <ActivityIndicator size="small" color={MATCHWAY_RED} />
          ) : query.length > 0 ? (
            <TouchableOpacity
              onPress={() => {
                setQuery("");

                setSuggestions([]);
              }}
            >
              <Ionicons name="close-circle" size={21} color="#98A2B3" />
            </TouchableOpacity>
          ) : null}
        </View>

        {suggestions.length > 0 ? (
          <View style={styles.resultsCard}>
            <ScrollView keyboardShouldPersistTaps="handled">
              {suggestions.map((suggestion) => (
                <TouchableOpacity
                  key={suggestion.placeId}
                  style={styles.resultRow}
                  onPress={() => chooseSuggestion(suggestion)}
                >
                  <Ionicons name="location-outline" size={20} color="#667085" />

                  <View style={styles.resultText}>
                    <Text style={styles.resultTitle}>
                      {suggestion.mainText}
                    </Text>

                    <Text style={styles.resultSubtitle} numberOfLines={1}>
                      {suggestion.secondaryText}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        ) : null}
      </View>

      {/* MAP */}
      <View style={styles.mapCard}>
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={{
            latitude: startCoordinate?.latitude ?? 31.95,

            longitude: startCoordinate?.longitude ?? 35.91,

            latitudeDelta: 2,
            longitudeDelta: 2,
          }}
        >
          {/* ECHTE GESAMTROUTE */}
          {displayRoute.length > 1 ? (
            <Polyline
              coordinates={displayRoute}
              strokeColor={MATCHWAY_RED}
              strokeWidth={6}
            />
          ) : null}

          {/* START */}
          {startCoordinate ? (
            <Marker
              coordinate={startCoordinate}
              title="Pickup"
              description={pickupLabel}
            >
              <View style={styles.pickupMarker}>
                <View style={styles.markerCenter} />
              </View>
            </Marker>
          ) : null}

          {/* ALLE STOPPS */}
          {stopMarkers.map((marker, index) => {
            const isCurrentStop = marker.stopPlaceId === stopPlaceId;

            const latitude =
              isCurrentStop && selectedPlace
                ? selectedPlace.latitude
                : marker.latitude;

            const longitude =
              isCurrentStop && selectedPlace
                ? selectedPlace.longitude
                : marker.longitude;

            const label =
              isCurrentStop && selectedPlace
                ? selectedPlace.label
                : marker.label;

            return (
              <Marker
                key={marker.stopPlaceId}
                coordinate={{
                  latitude,
                  longitude,
                }}
                title={`Stop ${index + 1}`}
                description={label}
              >
                <View
                  style={[
                    styles.stopMarker,

                    isCurrentStop && styles.currentStopMarker,
                  ]}
                >
                  <Text style={styles.stopMarkerText}>{index + 1}</Text>
                </View>
              </Marker>
            );
          })}

          {/* ZIEL */}
          {endCoordinate ? (
            <Marker
              coordinate={endCoordinate}
              title="Drop-off"
              description={dropoffLabel}
            >
              <View style={styles.dropoffMarker}>
                <Ionicons name="flag" size={15} color="#FFFFFF" />
              </View>
            </Marker>
          ) : null}
        </MapView>

        {loading ? (
          <View style={styles.mapLoading}>
            <ActivityIndicator size="large" color={MATCHWAY_RED} />
          </View>
        ) : null}
      </View>

      {selectedPlace ? (
        <View style={styles.selectedCard}>
          <View style={styles.selectedIcon}>
            <Ionicons name="location" size={20} color={MATCHWAY_RED} />
          </View>

          <View style={styles.selectedText}>
            <Text style={styles.selectedTitle}>{selectedPlace.label}</Text>

            <Text style={styles.selectedAddress} numberOfLines={2}>
              {selectedPlace.address}
            </Text>
          </View>
        </View>
      ) : null}

      <TouchableOpacity
        style={[
          styles.saveButton,

          (!selectedPlace || saving) && styles.saveButtonDisabled,
        ]}
        onPress={saveMeetingPoint}
        disabled={!selectedPlace || saving}
      >
        {saving ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <>
            <Text style={styles.saveText}>Save meeting point</Text>

            <Ionicons name="checkmark" size={21} color="#FFFFFF" />
          </>
        )}
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    backgroundColor: "#FFFFFF",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    marginBottom: 16,
  },

  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
  },

  headerText: {
    flex: 1,
    marginLeft: 14,
  },

  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
  },

  subtitle: {
    marginTop: 2,
    fontSize: 13,
    color: "#667085",
  },

  searchSection: {
    position: "relative",
    zIndex: 50,
  },

  searchBox: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    borderWidth: 1.5,
    borderColor: MATCHWAY_RED,
    borderRadius: 17,
    gap: 9,
    backgroundColor: "#FFFFFF",
  },

  input: {
    flex: 1,
    fontSize: 15,
    color: "#111827",
  },

  resultsCard: {
    position: "absolute",
    top: 64,
    left: 0,
    right: 0,
    maxHeight: 260,
    zIndex: 100,
    borderWidth: 1,
    borderColor: "#E4E7EC",
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
  },

  resultRow: {
    minHeight: 64,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#EAECF0",
    gap: 11,
  },

  resultText: {
    flex: 1,
  },

  resultTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
  },

  resultSubtitle: {
    marginTop: 2,
    fontSize: 12,
    color: "#667085",
  },

  mapCard: {
    flex: 1,
    marginTop: 14,
    borderRadius: 22,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E4E7EC",
    backgroundColor: "#F3F4F6",
  },

  map: {
    flex: 1,
  },

  mapLoading: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.80)",
  },

  pickupMarker: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 4,
    borderColor: MATCHWAY_RED,
    alignItems: "center",
    justifyContent: "center",
  },

  markerCenter: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: MATCHWAY_RED,
  },

  stopMarker: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#FFFFFF",
    borderWidth: 3,
    borderColor: MATCHWAY_RED,
    alignItems: "center",
    justifyContent: "center",
  },

  currentStopMarker: {
    backgroundColor: MATCHWAY_RED,
  },

  stopMarkerText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#111827",
  },

  dropoffMarker: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: MATCHWAY_RED,
    alignItems: "center",
    justifyContent: "center",
  },

  selectedCard: {
    minHeight: 72,
    marginTop: 12,
    padding: 13,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E4E7EC",
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
  },

  selectedIcon: {
    width: 40,
    height: 40,
    marginRight: 11,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF0F1",
  },

  selectedText: {
    flex: 1,
  },

  selectedTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
  },

  selectedAddress: {
    marginTop: 3,
    fontSize: 12,
    lineHeight: 17,
    color: "#667085",
  },

  saveButton: {
    height: 56,
    marginTop: 12,
    marginBottom: 10,
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: MATCHWAY_RED,
  },

  saveButtonDisabled: {
    opacity: 0.5,
  },

  saveText: {
    fontSize: 17,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
