import { useEffect, useRef, useState } from "react";

import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";

import Ionicons from "@expo/vector-icons/Ionicons";

import MapView, { Marker, Polyline, type LatLng } from "react-native-maps";

import { useOfferRideStore } from "../store/offerRideStore";

const MATCHWAY_RED = "#E63946";

type RouteOption = {
  id: string;

  isDefault: boolean;

  distanceMeters: number;
  durationSeconds: number;

  coordinates: LatLng[];
};

type RouteResponse = {
  distanceMeters: number;
  durationSeconds: number;
  coordinates: LatLng[];

  routes: RouteOption[];
};

function formatDistance(meters: number) {
  const kilometers = meters / 1000;

  if (kilometers < 10) {
    return `${kilometers.toFixed(1)} km`;
  }

  return `${Math.round(kilometers)} km`;
}

function formatDuration(seconds: number) {
  const totalMinutes = Math.round(seconds / 60);

  const hours = Math.floor(totalMinutes / 60);

  const minutes = totalMinutes % 60;

  if (hours === 0) {
    return `${minutes} min`;
  }

  if (minutes === 0) {
    return `${hours} h`;
  }

  return `${hours} h ${minutes} min`;
}

export default function OfferRouteScreen() {
  const mapRef = useRef<MapView>(null);

  const {
    pickupLabel,
    pickupPlaceId,

    dropoffLabel,
    dropoffPlaceId,

    setRouteSummary,
  } = useOfferRideStore();

  const [routes, setRoutes] = useState<RouteOption[]>([]);

  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const selectedRoute = routes[selectedRouteIndex];

  useEffect(() => {
    loadRoutes();
  }, [pickupPlaceId, dropoffPlaceId]);

  /*
    Wenn der Fahrer eine andere Route auswählt,
    zoomen wir die Karte auf genau diese Route.
  */
  useEffect(() => {
    if (!selectedRoute || selectedRoute.coordinates.length < 2) {
      return;
    }

    const timeout = setTimeout(() => {
      mapRef.current?.fitToCoordinates(selectedRoute.coordinates, {
        edgePadding: {
          top: 55,
          right: 40,
          bottom: 55,
          left: 40,
        },

        animated: true,
      });
    }, 250);

    return () => clearTimeout(timeout);
  }, [selectedRoute]);

  async function loadRoutes() {
    try {
      setLoading(true);
      setError("");

      const url =
        `http://localhost:3000/routing` +
        `?originPlaceId=${encodeURIComponent(pickupPlaceId)}` +
        `&destinationPlaceId=${encodeURIComponent(dropoffPlaceId)}`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error("Route request failed");
      }

      const data: RouteResponse = await response.json();

      if (!data.routes || data.routes.length === 0) {
        throw new Error("No routes found");
      }

      setRoutes(data.routes);

      /*
        Wenn Google eine Route als
        DEFAULT_ROUTE markiert hat,
        wählen wir sie zuerst aus.
      */
      const defaultIndex = data.routes.findIndex((route) => route.isDefault);

      setSelectedRouteIndex(defaultIndex >= 0 ? defaultIndex : 0);
    } catch (error) {
      console.error("Route loading error:", error);

      setRoutes([]);

      setError("We couldn't calculate this route.");
    } finally {
      setLoading(false);
    }
  }

  function selectRoute(index: number) {
    setSelectedRouteIndex(index);
  }

  function useRoute() {
    if (!selectedRoute) {
      return;
    }

    setRouteSummary(
      selectedRoute.distanceMeters,
      selectedRoute.durationSeconds,
    );

    Alert.alert("Route saved", "Your selected route was saved successfully.");
  }

  const startCoordinate = selectedRoute?.coordinates[0];

  const endCoordinate =
    selectedRoute?.coordinates[selectedRoute.coordinates.length - 1];

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={25} color="#111827" />
        </TouchableOpacity>

        <Text style={styles.title}>Choose your route</Text>

        <Text style={styles.subtitle}>Select the route you plan to drive.</Text>
      </View>

      {/* MAP */}
      <View style={styles.mapCard}>
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={{
            latitude: 31.95,
            longitude: 35.91,
            latitudeDelta: 4,
            longitudeDelta: 4,
          }}
        >
          {/* OTHER ROUTES */}
          {routes.map((route, index) => {
            if (index === selectedRouteIndex) {
              return null;
            }

            return (
              <Polyline
                key={route.id}
                coordinates={route.coordinates}
                strokeColor="#AEB4BE"
                strokeWidth={4}
              />
            );
          })}

          {/* SELECTED ROUTE */}
          {selectedRoute ? (
            <Polyline
              coordinates={selectedRoute.coordinates}
              strokeColor={MATCHWAY_RED}
              strokeWidth={6}
            />
          ) : null}

          {/* PICKUP */}
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

          {/* DROP OFF */}
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

            <Text style={styles.loadingText}>Calculating routes...</Text>
          </View>
        ) : null}
      </View>

      {/* ERROR */}
      {!loading && error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorTitle}>Route unavailable</Text>

          <Text style={styles.errorText}>{error}</Text>

          <TouchableOpacity style={styles.retryButton} onPress={loadRoutes}>
            <Text style={styles.retryText}>Try again</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {/* ROUTE OPTIONS */}
      {!loading && !error && routes.length > 0 ? (
        <>
          <ScrollView
            style={styles.optionsContainer}
            showsVerticalScrollIndicator={false}
          >
            {routes.map((route, index) => {
              const selected = index === selectedRouteIndex;

              return (
                <TouchableOpacity
                  key={route.id}
                  style={[
                    styles.routeOption,
                    selected && styles.routeOptionSelected,
                  ]}
                  onPress={() => selectRoute(index)}
                  activeOpacity={0.8}
                >
                  <View style={styles.radioArea}>
                    <View
                      style={[
                        styles.radioOuter,
                        selected && styles.radioOuterSelected,
                      ]}
                    >
                      {selected ? <View style={styles.radioInner} /> : null}
                    </View>
                  </View>

                  <View style={styles.optionInfo}>
                    <View style={styles.optionTitleRow}>
                      <Text style={styles.optionTitle}>Route {index + 1}</Text>

                      {route.isDefault ? (
                        <View style={styles.recommendedBadge}>
                          <Text style={styles.recommendedText}>
                            Recommended
                          </Text>
                        </View>
                      ) : null}
                    </View>

                    <View style={styles.optionStats}>
                      <View style={styles.smallStat}>
                        <Ionicons
                          name="time-outline"
                          size={17}
                          color="#667085"
                        />

                        <Text style={styles.smallStatText}>
                          {formatDuration(route.durationSeconds)}
                        </Text>
                      </View>

                      <View style={styles.statDot} />

                      <View style={styles.smallStat}>
                        <Ionicons
                          name="map-outline"
                          size={17}
                          color="#667085"
                        />

                        <Text style={styles.smallStatText}>
                          {formatDistance(route.distanceMeters)}
                        </Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <TouchableOpacity
            style={styles.continueButton}
            onPress={useRoute}
            activeOpacity={0.85}
          >
            <Text style={styles.continueText}>Use this route</Text>

            <Ionicons name="arrow-forward" size={21} color="#FFFFFF" />
          </TouchableOpacity>
        </>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
  },

  header: {
    paddingTop: 6,
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

  title: {
    marginTop: 18,

    fontSize: 29,
    fontWeight: "700",

    color: "#111827",
  },

  subtitle: {
    marginTop: 4,
    marginBottom: 14,

    fontSize: 14,
    color: "#667085",
  },

  mapCard: {
    height: 285,

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
    ...StyleSheet.absoluteFillObject,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: "rgba(255,255,255,0.88)",
  },

  loadingText: {
    marginTop: 10,

    fontSize: 14,
    color: "#667085",
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

  dropoffMarker: {
    width: 30,
    height: 30,

    borderRadius: 15,

    backgroundColor: MATCHWAY_RED,

    alignItems: "center",
    justifyContent: "center",
  },

  optionsContainer: {
    flex: 1,

    marginTop: 12,
  },

  routeOption: {
    minHeight: 76,

    flexDirection: "row",
    alignItems: "center",

    marginBottom: 9,

    paddingHorizontal: 14,
    paddingVertical: 11,

    borderWidth: 1,
    borderColor: "#E4E7EC",

    borderRadius: 17,

    backgroundColor: "#FFFFFF",
  },

  routeOptionSelected: {
    borderWidth: 1.5,
    borderColor: MATCHWAY_RED,

    backgroundColor: "#FFF7F7",
  },

  radioArea: {
    width: 35,
  },

  radioOuter: {
    width: 21,
    height: 21,

    borderRadius: 11,

    borderWidth: 2,
    borderColor: "#B7BDC7",

    alignItems: "center",
    justifyContent: "center",
  },

  radioOuterSelected: {
    borderColor: MATCHWAY_RED,
  },

  radioInner: {
    width: 10,
    height: 10,

    borderRadius: 5,

    backgroundColor: MATCHWAY_RED,
  },

  optionInfo: {
    flex: 1,
  },

  optionTitleRow: {
    flexDirection: "row",
    alignItems: "center",

    gap: 8,
  },

  optionTitle: {
    fontSize: 16,
    fontWeight: "700",

    color: "#111827",
  },

  recommendedBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,

    borderRadius: 8,

    backgroundColor: "#FFF0F1",
  },

  recommendedText: {
    fontSize: 10,
    fontWeight: "700",

    color: MATCHWAY_RED,
  },

  optionStats: {
    flexDirection: "row",
    alignItems: "center",

    marginTop: 7,
  },

  smallStat: {
    flexDirection: "row",
    alignItems: "center",

    gap: 4,
  },

  smallStatText: {
    fontSize: 13,
    fontWeight: "600",

    color: "#667085",
  },

  statDot: {
    width: 4,
    height: 4,

    borderRadius: 2,

    backgroundColor: "#C7CBD1",

    marginHorizontal: 9,
  },

  continueButton: {
    height: 56,

    marginTop: 5,
    marginBottom: 10,

    borderRadius: 18,

    backgroundColor: MATCHWAY_RED,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",

    gap: 8,
  },

  continueText: {
    fontSize: 17,
    fontWeight: "700",

    color: "#FFFFFF",
  },

  errorBox: {
    marginTop: 18,

    padding: 18,

    borderRadius: 18,

    backgroundColor: "#FFF5F6",
  },

  errorTitle: {
    fontSize: 17,
    fontWeight: "700",

    color: "#111827",
  },

  errorText: {
    marginTop: 4,

    fontSize: 14,
    color: "#667085",
  },

  retryButton: {
    marginTop: 12,

    alignSelf: "flex-start",
  },

  retryText: {
    fontSize: 15,
    fontWeight: "700",

    color: MATCHWAY_RED,
  },
});
