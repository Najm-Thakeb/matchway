import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";

import { useSearchStore } from "../store/searchStore";

const MATCHWAY_RED = "#E63946";

type Ride = {
  id: string;
  from: string;
  to: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  price: number;
  availableSeats: number;
  driver: string;
  rating: number;
  vehicleType: string;
};

function getSelectedDate(dateString?: string) {
  if (dateString) {
    return new Date(dateString);
  }

  return new Date();
}

function formatDate(dateString?: string) {
  const selectedDate = getSelectedDate(dateString);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const comparisonDate = new Date(selectedDate);

  comparisonDate.setHours(0, 0, 0, 0);

  if (comparisonDate.getTime() === today.getTime()) {
    return "Today";
  }

  if (comparisonDate.getTime() === tomorrow.getTime()) {
    return "Tomorrow";
  }

  return selectedDate.toLocaleDateString("en-US", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function formatDateForApi(dateString?: string) {
  const date = getSelectedDate(dateString);

  const year = date.getFullYear();

  const month = String(date.getMonth() + 1).padStart(2, "0");

  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getCityName(label: string) {
  return label.split(",")[0].trim();
}

export default function ResultsScreen() {
  const {
    fromLabel,
    fromPlaceId,

    toLabel,
    toPlaceId,

    departureDate,
    passengers,
  } = useSearchStore();

  const [rides, setRides] = useState<Ride[]>([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const passengerText =
    passengers === 1 ? "1 passenger" : `${passengers} passengers`;

  useEffect(() => {
    searchRides();
  }, [fromLabel, fromPlaceId, toLabel, toPlaceId, departureDate, passengers]);

  async function searchRides() {
    try {
      setLoading(true);
      setError("");

      const from = getCityName(fromLabel);

      const to = getCityName(toLabel);

      const date = formatDateForApi(departureDate);

      const url =
        `http://localhost:3000/rides/search` +
        `?from=${encodeURIComponent(from)}` +
        `&to=${encodeURIComponent(to)}` +
        `&fromPlaceId=${encodeURIComponent(fromPlaceId)}` +
        `&toPlaceId=${encodeURIComponent(toPlaceId)}` +
        `&date=${encodeURIComponent(date)}` +
        `&passengers=${passengers}`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error("Ride search failed");
      }

      const data: Ride[] = await response.json();

      setRides(data);
    } catch (error) {
      console.error("Ride search error:", error);

      setError("Could not load rides. Please try again.");

      setRides([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topArea}>
        <View style={styles.searchHeader}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.searchSummary}
            onPress={() => router.push("/edit-search")}
          >
            <Text style={styles.routeText} numberOfLines={1}>
              {getCityName(fromLabel)} → {getCityName(toLabel)}
            </Text>

            <Text style={styles.searchInfo}>
              {formatDate(departureDate)}, {passengerText}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.filterButton}>
            <Text style={styles.filterText}>Filter</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.results}
        contentContainerStyle={styles.resultsContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.dateTitle}>{formatDate(departureDate)}</Text>

        {loading && <ActivityIndicator size="large" color={MATCHWAY_RED} />}

        {!loading && error ? (
          <View style={styles.messageBox}>
            <Text style={styles.messageTitle}>Something went wrong</Text>

            <Text style={styles.messageText}>{error}</Text>
          </View>
        ) : null}

        {!loading && !error && rides.length === 0 && (
          <View style={styles.messageBox}>
            <Text style={styles.messageTitle}>No rides found</Text>

            <Text style={styles.messageText}>
              There are currently no rides for this route and date.
            </Text>
          </View>
        )}

        {!loading &&
          !error &&
          rides.map((ride) => (
            <TouchableOpacity
              key={ride.id}
              style={styles.rideCard}
              activeOpacity={0.85}
            >
              <View style={styles.driverSection}>
                <Ionicons name="car-outline" size={20} color="#667085" />

                <View style={styles.avatar}>
                  <Ionicons name="person" size={20} color="#667085" />
                </View>

                <View style={styles.driverInfo}>
                  <Text style={styles.driver}>{ride.driver}</Text>

                  <View style={styles.ratingRow}>
                    <Ionicons name="star" size={14} color="#667085" />

                    <Text style={styles.rating}>{ride.rating}</Text>
                  </View>
                </View>

                <View style={styles.seatsBox}>
                  <Ionicons name="people-outline" size={19} color="#667085" />

                  <Text style={styles.seats}>{ride.availableSeats}</Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.tripSection}>
                <View style={styles.priceRow}>
                  <Text style={styles.price}>{ride.price} JOD</Text>
                </View>

                <View style={styles.horizontalRoute}>
                  <View style={styles.locationBlock}>
                    <Text style={styles.city}>{ride.from}</Text>

                    <Text style={styles.time}>{ride.departureTime}</Text>
                  </View>

                  <View style={styles.routeMiddle}>
                    <View style={styles.routeDot} />

                    <View style={styles.routeLine} />

                    <Text style={styles.routeDuration}>{ride.duration} h</Text>

                    <View style={styles.routeLine} />

                    <View style={styles.routeDot} />
                  </View>

                  <View style={[styles.locationBlock, styles.locationRight]}>
                    <Text style={styles.city}>{ride.to}</Text>

                    <Text style={styles.time}>{ride.arrivalTime}</Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F6F8",
  },

  topArea: {
    backgroundColor: "#FFFFFF",
    paddingBottom: 10,
  },

  searchHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  backButton: {
    width: 34,
    justifyContent: "center",
  },

  backIcon: {
    fontSize: 32,
    color: "#667085",
  },

  searchSummary: {
    flex: 1,
  },

  routeText: {
    fontSize: 17,
    fontWeight: "600",
    color: "#111827",
  },

  searchInfo: {
    fontSize: 14,
    color: "#667085",
    marginTop: 1,
  },

  filterButton: {
    paddingHorizontal: 6,
    paddingVertical: 6,
  },

  filterText: {
    fontSize: 16,
    fontWeight: "700",
    color: MATCHWAY_RED,
  },

  results: {
    flex: 1,
  },

  resultsContent: {
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 30,
  },

  dateTitle: {
    fontSize: 23,
    fontWeight: "700",
    color: "#111827",
    marginLeft: 2,
    marginBottom: 10,
  },

  rideCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E4E7EC",
    marginBottom: 10,
    overflow: "hidden",
  },

  driverSection: {
    flexDirection: "row",
    alignItems: "center",
    height: 58,
    paddingHorizontal: 12,
    gap: 8,
  },

  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F0F1F3",
    alignItems: "center",
    justifyContent: "center",
  },

  driverInfo: {
    flex: 1,
  },

  driver: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
  },

  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginTop: 1,
  },

  rating: {
    fontSize: 13,
    color: "#667085",
  },

  seatsBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },

  seats: {
    fontSize: 13,
    color: "#667085",
  },

  divider: {
    height: 1,
    backgroundColor: "#E5E7EB",
  },

  tripSection: {
    paddingHorizontal: 12,
    paddingTop: 7,
    paddingBottom: 10,
  },

  priceRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 5,
  },

  price: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },

  horizontalRoute: {
    flexDirection: "row",
    alignItems: "center",
  },

  locationBlock: {
    width: 68,
  },

  locationRight: {
    alignItems: "flex-end",
  },

  city: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
  },

  time: {
    fontSize: 13,
    color: "#667085",
    marginTop: 1,
  },

  routeMiddle: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 2,
  },

  routeDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: MATCHWAY_RED,
    backgroundColor: "#FFFFFF",
  },

  routeLine: {
    flex: 1,
    height: 1.5,
    backgroundColor: MATCHWAY_RED,
  },

  routeDuration: {
    fontSize: 11,
    fontWeight: "600",
    color: "#667085",
    marginHorizontal: 4,
  },

  messageBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 26,
    alignItems: "center",
  },

  messageTitle: {
    fontSize: 19,
    fontWeight: "700",
    color: "#111827",
  },

  messageText: {
    fontSize: 14,
    color: "#667085",
    textAlign: "center",
    marginTop: 7,
  },
});
