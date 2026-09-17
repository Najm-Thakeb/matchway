import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";

import { useOfferRideStore } from "../store/offerRideStore";

const MATCHWAY_RED = "#E63946";

function formatDistance(distanceMeters: number) {
  return `${Math.round(distanceMeters / 1000)} km`;
}

function formatDuration(durationSeconds: number) {
  const hours = Math.floor(durationSeconds / 3600);
  const minutes = Math.round((durationSeconds % 3600) / 60);

  if (hours === 0) {
    return `${minutes} min`;
  }

  return `${hours}h ${minutes}m`;
}

function formatDate(dateString: string) {
  if (!dateString) {
    return "";
  }

  const date = new Date(dateString);

  return date.toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function OfferReviewScreen() {
  const {
    pickupLabel,
    dropoffLabel,
    stops,

    routeDistanceMeters,
    routeDurationSeconds,

    departureDate,
    departureTime,

    availableSeats,

    pricePerSeat,
    currency,

    bookingPreference,

    rideComment,
    setRideComment,
  } = useOfferRideStore();

  const bookingText =
    bookingPreference === "instant" ? "Instant booking" : "Review requests";

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* BACK */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={25} color="#111827" />
        </TouchableOpacity>

        <Text style={styles.title}>Review your ride</Text>

        <ScrollView
          style={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ROUTE */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Route</Text>

            <View style={styles.routeRow}>
              <View>
                <View style={styles.startDot} />

                <View style={styles.routeLine} />

                <View style={styles.endDot} />
              </View>

              <View style={styles.routeText}>
                <View>
                  <Text style={styles.smallLabel}>Pickup</Text>

                  <Text style={styles.location} numberOfLines={2}>
                    {pickupLabel}
                  </Text>
                </View>

                <View style={styles.destination}>
                  <Text style={styles.smallLabel}>Drop-off</Text>

                  <Text style={styles.location} numberOfLines={2}>
                    {dropoffLabel}
                  </Text>
                </View>
              </View>
            </View>

            {stops.length > 0 ? (
              <View style={styles.stopsBox}>
                <Text style={styles.smallLabel}>Stops</Text>

                {stops.map((stop, index) => (
                  <Text key={stop.placeId} style={styles.stopText}>
                    {index + 1}. {stop.label}
                  </Text>
                ))}
              </View>
            ) : null}

            <View style={styles.routeInfoRow}>
              <View style={styles.infoItem}>
                <Ionicons name="map-outline" size={20} color={MATCHWAY_RED} />

                <Text style={styles.infoValue}>
                  {formatDistance(routeDistanceMeters)}
                </Text>
              </View>

              <View style={styles.infoItem}>
                <Ionicons name="time-outline" size={20} color={MATCHWAY_RED} />

                <Text style={styles.infoValue}>
                  {formatDuration(routeDurationSeconds)}
                </Text>
              </View>
            </View>
          </View>

          {/* DEPARTURE */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Departure</Text>

            <View style={styles.detailRow}>
              <Ionicons
                name="calendar-outline"
                size={23}
                color={MATCHWAY_RED}
              />

              <Text style={styles.detailText}>{formatDate(departureDate)}</Text>
            </View>

            <View style={styles.detailRow}>
              <Ionicons name="time-outline" size={23} color={MATCHWAY_RED} />

              <Text style={styles.detailText}>{departureTime}</Text>
            </View>
          </View>

          {/* RIDE DETAILS */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Ride details</Text>

            <View style={styles.summaryRow}>
              <View style={styles.summaryLeft}>
                <Ionicons
                  name="people-outline"
                  size={22}
                  color={MATCHWAY_RED}
                />

                <Text style={styles.summaryLabel}>Available seats</Text>
              </View>

              <Text style={styles.summaryValue}>{availableSeats}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.summaryRow}>
              <View style={styles.summaryLeft}>
                <Ionicons name="cash-outline" size={22} color={MATCHWAY_RED} />

                <Text style={styles.summaryLabel}>Price per seat</Text>
              </View>

              <Text style={styles.summaryValue}>
                {pricePerSeat} {currency}
              </Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.summaryRow}>
              <View style={styles.summaryLeft}>
                <Ionicons
                  name={
                    bookingPreference === "instant"
                      ? "flash-outline"
                      : "person-add-outline"
                  }
                  size={22}
                  color={MATCHWAY_RED}
                />

                <Text style={styles.summaryLabel}>Booking</Text>
              </View>

              <Text style={styles.bookingValue}>{bookingText}</Text>
            </View>
          </View>

          {/* OPTIONAL COMMENT */}
          <View style={styles.card}>
            <View style={styles.commentHeader}>
              <Text style={styles.sectionTitleNoMargin}>
                Anything passengers should know?
              </Text>

              <View style={styles.optionalBadge}>
                <Text style={styles.optionalText}>Optional</Text>
              </View>
            </View>

            <Text style={styles.commentDescription}>
              Add useful details about your ride.
            </Text>

            <TextInput
              style={styles.commentInput}
              value={rideComment}
              onChangeText={setRideComment}
              placeholder="e.g. luggage, music, pickup details..."
              placeholderTextColor="#98A2B3"
              multiline
              maxLength={300}
              textAlignVertical="top"
            />

            <Text style={styles.characterCount}>{rideComment.length}/300</Text>
          </View>

          <View style={styles.bottomSpace} />
        </ScrollView>

        {/* PUBLISH */}
        <TouchableOpacity
          style={styles.publishButton}
          onPress={() => {
            /*
              Next:
              Save ride with NestJS
              + Prisma + PostgreSQL.
            */
          }}
        >
          <Text style={styles.publishText}>Publish ride</Text>

          <Ionicons name="checkmark" size={22} color="#FFFFFF" />
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  keyboardContainer: {
    flex: 1,
    paddingHorizontal: 20,
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
    marginBottom: 18,

    fontSize: 30,
    fontWeight: "700",

    color: "#111827",
  },

  scroll: {
    flex: 1,
  },

  card: {
    marginBottom: 14,
    padding: 18,

    borderRadius: 20,

    borderWidth: 1,
    borderColor: "#E4E7EC",

    backgroundColor: "#FFFFFF",
  },

  sectionTitle: {
    marginBottom: 18,

    fontSize: 18,
    fontWeight: "700",

    color: "#111827",
  },

  sectionTitleNoMargin: {
    flex: 1,

    fontSize: 18,
    fontWeight: "700",

    color: "#111827",
  },

  routeRow: {
    flexDirection: "row",
  },

  startDot: {
    width: 11,
    height: 11,

    borderRadius: 6,

    borderWidth: 2,
    borderColor: MATCHWAY_RED,

    backgroundColor: "#FFFFFF",
  },

  routeLine: {
    width: 2,
    height: 53,

    marginLeft: 4,

    backgroundColor: "#D0D5DD",
  },

  endDot: {
    width: 11,
    height: 11,

    borderRadius: 6,

    backgroundColor: MATCHWAY_RED,
  },

  routeText: {
    flex: 1,

    marginLeft: 13,
  },

  destination: {
    marginTop: 27,
  },

  smallLabel: {
    fontSize: 12,
    fontWeight: "600",

    color: "#667085",
  },

  location: {
    marginTop: 3,

    fontSize: 15,
    fontWeight: "600",

    color: "#111827",
  },

  stopsBox: {
    marginTop: 18,
    padding: 13,

    borderRadius: 14,

    backgroundColor: "#F8F9FA",
  },

  stopText: {
    marginTop: 5,

    fontSize: 14,

    color: "#344054",
  },

  routeInfoRow: {
    marginTop: 20,

    flexDirection: "row",

    gap: 24,
  },

  infoItem: {
    flexDirection: "row",
    alignItems: "center",

    gap: 7,
  },

  infoValue: {
    fontSize: 14,
    fontWeight: "600",

    color: "#344054",
  },

  detailRow: {
    flexDirection: "row",
    alignItems: "center",

    gap: 12,

    marginBottom: 14,
  },

  detailText: {
    fontSize: 16,
    fontWeight: "600",

    color: "#111827",
  },

  summaryRow: {
    minHeight: 42,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  summaryLeft: {
    flex: 1,

    flexDirection: "row",
    alignItems: "center",

    gap: 11,
  },

  summaryLabel: {
    fontSize: 15,
    fontWeight: "600",

    color: "#344054",
  },

  summaryValue: {
    fontSize: 16,
    fontWeight: "700",

    color: "#111827",
  },

  bookingValue: {
    maxWidth: 140,

    textAlign: "right",

    fontSize: 14,
    fontWeight: "700",

    color: "#111827",
  },

  divider: {
    height: 1,

    marginVertical: 9,

    backgroundColor: "#EAECF0",
  },

  commentHeader: {
    flexDirection: "row",
    alignItems: "center",

    gap: 10,
  },

  optionalBadge: {
    paddingHorizontal: 9,
    paddingVertical: 4,

    borderRadius: 9,

    backgroundColor: "#F2F4F7",
  },

  optionalText: {
    fontSize: 11,
    fontWeight: "700",

    color: "#667085",
  },

  commentDescription: {
    marginTop: 7,

    fontSize: 13,
    lineHeight: 19,

    color: "#667085",
  },

  commentInput: {
    minHeight: 115,

    marginTop: 14,
    padding: 14,

    borderWidth: 1.5,
    borderColor: "#E4E7EC",

    borderRadius: 16,

    fontSize: 15,
    lineHeight: 21,

    color: "#111827",

    backgroundColor: "#FFFFFF",
  },

  characterCount: {
    marginTop: 7,

    textAlign: "right",

    fontSize: 12,

    color: "#98A2B3",
  },

  bottomSpace: {
    height: 10,
  },

  publishButton: {
    height: 58,

    marginTop: 10,
    marginBottom: 10,

    borderRadius: 18,

    backgroundColor: MATCHWAY_RED,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",

    gap: 8,
  },

  publishText: {
    fontSize: 17,
    fontWeight: "700",

    color: "#FFFFFF",
  },
});
