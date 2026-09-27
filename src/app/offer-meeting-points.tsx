import { useEffect, useState } from "react";

import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

import { router } from "expo-router";

import { SafeAreaView } from "react-native-safe-area-context";

import Ionicons from "@expo/vector-icons/Ionicons";

import { useOfferRideStore } from "../store/offerRideStore";

const MATCHWAY_RED = "#E63946";

type MeetingPoint = {
  stopPlaceId: string;
  stopLabel: string;

  meetingPointPlaceId: string;
  meetingPointLabel: string;
  meetingPointAddress: string;

  primaryType: string;

  extraDurationSeconds: number;
  extraDistanceMeters: number;

  fallback: boolean;
};

type RouteCoordinate = {
  latitude: number;
  longitude: number;
};

type RouteResponse = {
  distanceMeters: number;

  durationSeconds: number;

  coordinates: RouteCoordinate[];

  optimizedIntermediateWaypointIndex: number[];
};

type OptimizeResponse = {
  meetingPoints: MeetingPoint[];

  route: {
    distanceMeters: number;

    durationSeconds: number;

    coordinates: RouteCoordinate[];
  };
};

function formatDetour(seconds: number) {
  if (seconds <= 0) {
    return "No extra time";
  }

  const minutes = Math.max(1, Math.round(seconds / 60));

  return `+${minutes} min detour`;
}

export default function OfferMeetingPointsScreen() {
  const {
    pickupPlaceId,
    dropoffPlaceId,

    selectedRouteId,

    stops,

    reorderStops,

    setStopMeetingPoint,

    setSelectedRoute,
  } = useOfferRideStore();

  const [meetingPoints, setMeetingPoints] = useState<MeetingPoint[]>([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  useEffect(() => {
    loadMeetingPoints();
  }, []);

  /*
   * Google entscheidet zuerst,
   * in welcher Reihenfolge
   * die Stop-Städte gefahren
   * werden sollen.
   */
  async function optimizeStopOrder() {
    if (stops.length <= 1) {
      return stops;
    }

    const response = await fetch("http://localhost:3000/routing", {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        originPlaceId: pickupPlaceId,

        destinationPlaceId: dropoffPlaceId,

        intermediatePlaceIds: stops.map((stop) => stop.placeId),

        optimizeWaypointOrder: true,
      }),
    });

    if (!response.ok) {
      throw new Error("Stop order optimization failed");
    }

    const data: RouteResponse = await response.json();

    const indexes = data.optimizedIntermediateWaypointIndex ?? [];

    /*
     * Google sollte bei zwei Stops
     * beispielsweise liefern:
     *
     * [1, 0]
     *
     * Dann wird aus:
     *
     * Neumünster, Lübeck
     *
     * →
     *
     * Lübeck, Neumünster
     */
    const validIndexes =
      indexes.length === stops.length &&
      new Set(indexes).size === stops.length &&
      indexes.every((index) => index >= 0 && index < stops.length);

    if (!validIndexes) {
      return stops;
    }

    const orderedStops = indexes.map((index) => stops[index]);

    reorderStops(orderedStops.map((stop) => stop.placeId));

    return orderedStops;
  }

  async function loadMeetingPoints() {
    if (!pickupPlaceId || !dropoffPlaceId || stops.length === 0) {
      setLoading(false);

      return;
    }

    try {
      setLoading(true);
      setError("");

      /*
       * SCHRITT 1:
       * Richtige Stop-Reihenfolge.
       */
      const orderedStops = await optimizeStopOrder();

      /*
       * SCHRITT 2:
       * Jetzt Smart Meeting Points
       * in genau dieser Reihenfolge.
       */
      const response = await fetch(
        "http://localhost:3000/locations/optimize-meeting-points",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            originPlaceId: pickupPlaceId,

            destinationPlaceId: dropoffPlaceId,

            stops: orderedStops.map((stop) => ({
              placeId: stop.placeId,

              label: stop.label,
            })),
          }),
        },
      );

      if (!response.ok) {
        throw new Error("Meeting point optimization failed");
      }

      const data: OptimizeResponse = await response.json();

      setMeetingPoints(data.meetingPoints);

      /*
       * Ganz wichtig:
       *
       * Jetzt speichern wir die
       * ECHTE Route:
       *
       * Kiel
       * → Stop 1
       * → Stop 2
       * → Hamburg
       */
      setSelectedRoute(
        selectedRouteId,

        data.route.distanceMeters,

        data.route.durationSeconds,

        data.route.coordinates,
      );

      for (const meetingPoint of data.meetingPoints) {
        if (meetingPoint.fallback || !meetingPoint.meetingPointPlaceId) {
          setStopMeetingPoint(meetingPoint.stopPlaceId, "", "", "");

          continue;
        }

        setStopMeetingPoint(
          meetingPoint.stopPlaceId,

          meetingPoint.meetingPointLabel,

          meetingPoint.meetingPointPlaceId,

          meetingPoint.meetingPointAddress,
        );
      }
    } catch (error) {
      console.error("Meeting points error:", error);

      setError("We couldn't find meeting points.");
    } finally {
      setLoading(false);
    }
  }

  function openMeetingPoint(stopPlaceId: string) {
    router.push({
      pathname: "/offer-meeting-point-map",

      params: {
        stopPlaceId,
      },
    });
  }

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={25} color="#111827" />
      </TouchableOpacity>

      <Text style={styles.title}>Meeting points</Text>

      <Text style={styles.subtitle}>
        MatchWay recommends convenient meeting points. Tap one if you want to
        change it.
      </Text>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={MATCHWAY_RED} />

          <Text style={styles.loadingText}>
            Finding the best route and meeting points...
          </Text>
        </View>
      ) : null}

      {!loading && error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorTitle}>Something went wrong</Text>

          <Text style={styles.errorText}>{error}</Text>

          <TouchableOpacity onPress={loadMeetingPoints}>
            <Text style={styles.retryText}>Try again</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {!loading && !error ? (
        <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
          {meetingPoints.map((meetingPoint, index) => {
            const storedStop = stops.find(
              (stop) => stop.placeId === meetingPoint.stopPlaceId,
            );

            const displayLabel =
              storedStop?.meetingPointLabel || meetingPoint.meetingPointLabel;

            const displayAddress =
              storedStop?.meetingPointAddress ||
              meetingPoint.meetingPointAddress;

            const hasMeetingPoint = Boolean(
              storedStop?.meetingPointPlaceId ||
              meetingPoint.meetingPointPlaceId,
            );

            const manuallyChanged = Boolean(
              storedStop?.meetingPointPlaceId &&
              storedStop.meetingPointPlaceId !==
                meetingPoint.meetingPointPlaceId,
            );

            return (
              <TouchableOpacity
                key={meetingPoint.stopPlaceId}
                style={styles.card}
                onPress={() => openMeetingPoint(meetingPoint.stopPlaceId)}
                activeOpacity={0.75}
              >
                <View style={styles.cardTop}>
                  <View style={styles.number}>
                    <Text style={styles.numberText}>{index + 1}</Text>
                  </View>

                  <View style={styles.cardContent}>
                    <Text style={styles.city}>
                      {meetingPoint.stopLabel.split(",")[0]}
                    </Text>

                    {hasMeetingPoint ? (
                      <>
                        <Text style={styles.meetingPoint}>{displayLabel}</Text>

                        {displayAddress ? (
                          <Text style={styles.address} numberOfLines={2}>
                            {displayAddress}
                          </Text>
                        ) : null}

                        {!manuallyChanged ? (
                          <View style={styles.detourRow}>
                            <Ionicons
                              name="time-outline"
                              size={15}
                              color="#667085"
                            />

                            <Text style={styles.detour}>
                              {formatDetour(meetingPoint.extraDurationSeconds)}
                            </Text>
                          </View>
                        ) : null}
                      </>
                    ) : (
                      <Text style={styles.chooseText}>
                        Choose a meeting point
                      </Text>
                    )}
                  </View>

                  <Ionicons name="chevron-forward" size={22} color="#98A2B3" />
                </View>

                <View style={styles.bottomRow}>
                  <Ionicons
                    name={
                      manuallyChanged ? "person-outline" : "sparkles-outline"
                    }
                    size={14}
                    color={MATCHWAY_RED}
                  />

                  <Text style={styles.changeHint}>
                    {manuallyChanged
                      ? "Selected by you"
                      : hasMeetingPoint
                        ? "Recommended by MatchWay · Tap to change"
                        : "Tap to choose"}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      ) : null}

      {!loading && !error ? (
        <TouchableOpacity
          style={styles.continueButton}
          onPress={() => router.push("/offer-date-time")}
        >
          <Text style={styles.continueText}>Continue</Text>

          <Ionicons name="arrow-forward" size={21} color="#FFFFFF" />
        </TouchableOpacity>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    backgroundColor: "#FFFFFF",
  },

  backButton: {
    width: 44,
    height: 44,
    marginTop: 6,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
  },

  title: {
    marginTop: 24,
    fontSize: 30,
    fontWeight: "700",
    color: "#111827",
  },

  subtitle: {
    marginTop: 7,
    marginBottom: 18,
    fontSize: 14,
    lineHeight: 20,
    color: "#667085",
  },

  loadingBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#667085",
  },

  list: {
    flex: 1,
  },

  card: {
    marginBottom: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: "#E4E7EC",
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
  },

  cardTop: {
    flexDirection: "row",
    alignItems: "center",
  },

  number: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: MATCHWAY_RED,
  },

  numberText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  cardContent: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },

  city: {
    fontSize: 12,
    fontWeight: "600",
    color: "#667085",
  },

  meetingPoint: {
    marginTop: 3,
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },

  address: {
    marginTop: 3,
    fontSize: 12,
    lineHeight: 17,
    color: "#667085",
  },

  detourRow: {
    marginTop: 7,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  detour: {
    fontSize: 12,
    fontWeight: "600",
    color: "#667085",
  },

  chooseText: {
    marginTop: 4,
    fontSize: 14,
    fontWeight: "700",
    color: MATCHWAY_RED,
  },

  bottomRow: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  changeHint: {
    fontSize: 11,
    fontWeight: "600",
    color: MATCHWAY_RED,
  },

  continueButton: {
    height: 56,
    marginTop: 10,
    marginBottom: 10,
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: MATCHWAY_RED,
  },

  continueText: {
    fontSize: 17,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  errorBox: {
    padding: 18,
    borderRadius: 18,
    backgroundColor: "#FFF5F6",
  },

  errorTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },

  errorText: {
    marginTop: 5,
    fontSize: 13,
    color: "#667085",
  },

  retryText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: "700",
    color: MATCHWAY_RED,
  },
});
