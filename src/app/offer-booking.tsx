import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";

import { useOfferRideStore } from "../store/offerRideStore";

const MATCHWAY_RED = "#E63946";

export default function OfferBookingScreen() {
  const { bookingPreference, setBookingPreference } = useOfferRideStore();

  function continueToReview() {
    if (!bookingPreference) {
      return;
    }

    router.push("/offer-review");
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* BACK */}
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={25} color="#111827" />
      </TouchableOpacity>

      {/* TITLE */}
      <Text style={styles.title}>How should passengers book?</Text>

      <Text style={styles.subtitle}>
        Choose how you want to accept bookings.
      </Text>

      {/* INSTANT BOOKING */}
      <TouchableOpacity
        activeOpacity={0.8}
        style={[
          styles.optionCard,
          bookingPreference === "instant" && styles.optionCardSelected,
        ]}
        onPress={() => setBookingPreference("instant")}
      >
        <View style={styles.optionTop}>
          <View style={styles.iconBox}>
            <Ionicons name="flash-outline" size={27} color={MATCHWAY_RED} />
          </View>

          <View
            style={[
              styles.radio,
              bookingPreference === "instant" && styles.radioSelected,
            ]}
          >
            {bookingPreference === "instant" ? (
              <Ionicons name="checkmark" size={16} color="#FFFFFF" />
            ) : null}
          </View>
        </View>

        <Text style={styles.optionTitle}>Instant booking</Text>

        <Text style={styles.optionDescription}>
          Passengers can book immediately without waiting for your approval.
        </Text>
      </TouchableOpacity>

      {/* REVIEW REQUEST */}
      <TouchableOpacity
        activeOpacity={0.8}
        style={[
          styles.optionCard,
          bookingPreference === "review" && styles.optionCardSelected,
        ]}
        onPress={() => setBookingPreference("review")}
      >
        <View style={styles.optionTop}>
          <View style={styles.iconBox}>
            <Ionicons
              name="person-add-outline"
              size={27}
              color={MATCHWAY_RED}
            />
          </View>

          <View
            style={[
              styles.radio,
              bookingPreference === "review" && styles.radioSelected,
            ]}
          >
            {bookingPreference === "review" ? (
              <Ionicons name="checkmark" size={16} color="#FFFFFF" />
            ) : null}
          </View>
        </View>

        <Text style={styles.optionTitle}>Review requests</Text>

        <Text style={styles.optionDescription}>
          You decide whether to accept each passenger before the booking is
          confirmed.
        </Text>
      </TouchableOpacity>

      {/* CONTINUE */}
      <TouchableOpacity
        style={[
          styles.continueButton,
          !bookingPreference && styles.continueButtonDisabled,
        ]}
        disabled={!bookingPreference}
        onPress={continueToReview}
      >
        <Text style={styles.continueText}>Continue</Text>

        <Ionicons name="arrow-forward" size={21} color="#FFFFFF" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
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
    marginTop: 26,

    fontSize: 30,
    fontWeight: "700",

    color: "#111827",
  },

  subtitle: {
    marginTop: 7,
    marginBottom: 28,

    fontSize: 14,
    color: "#667085",
  },

  optionCard: {
    padding: 20,

    marginBottom: 16,

    borderWidth: 1.5,
    borderColor: "#E4E7EC",

    borderRadius: 22,

    backgroundColor: "#FFFFFF",
  },

  optionCardSelected: {
    borderColor: MATCHWAY_RED,
    backgroundColor: "#FFF7F7",
  },

  optionTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  iconBox: {
    width: 50,
    height: 50,

    borderRadius: 16,

    backgroundColor: "#FFF1F2",

    alignItems: "center",
    justifyContent: "center",
  },

  radio: {
    width: 28,
    height: 28,

    borderRadius: 14,

    borderWidth: 2,
    borderColor: "#D0D5DD",

    alignItems: "center",
    justifyContent: "center",
  },

  radioSelected: {
    borderColor: MATCHWAY_RED,
    backgroundColor: MATCHWAY_RED,
  },

  optionTitle: {
    marginTop: 17,

    fontSize: 19,
    fontWeight: "700",

    color: "#111827",
  },

  optionDescription: {
    marginTop: 7,

    fontSize: 14,
    lineHeight: 21,

    color: "#667085",
  },

  continueButton: {
    height: 56,

    marginTop: "auto",
    marginBottom: 10,

    borderRadius: 18,

    backgroundColor: MATCHWAY_RED,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",

    gap: 8,
  },

  continueButtonDisabled: {
    opacity: 0.4,
  },

  continueText: {
    fontSize: 17,
    fontWeight: "700",

    color: "#FFFFFF",
  },
});
