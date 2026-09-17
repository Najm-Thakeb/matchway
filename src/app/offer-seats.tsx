import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";

import SeatPicker from "../components/SeatPicker";
import { useOfferRideStore } from "../store/offerRideStore";

const MATCHWAY_RED = "#E63946";

export default function OfferSeatsScreen() {
  const { availableSeats, setAvailableSeats } = useOfferRideStore();

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={25} color="#111827" />
      </TouchableOpacity>

      <Text style={styles.title}>How many seats are available?</Text>

      <Text style={styles.subtitle}>
        Tell passengers how many seats you can offer.
      </Text>

      <View style={styles.pickerContainer}>
        <SeatPicker
          value={availableSeats}
          onChange={setAvailableSeats}
          label="Available seats"
          singularLabel="Seat"
          pluralLabel="Seats"
        />
      </View>

      <View style={styles.infoRow}>
        <Ionicons name="information-circle-outline" size={21} color="#667085" />

        <Text style={styles.infoText}>
          You can change the number of available seats later.
        </Text>
      </View>

      <TouchableOpacity
        style={styles.continueButton}
        onPress={() => {
          router.push("/offer-price");
        }}
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

    fontSize: 14,
    lineHeight: 21,

    color: "#667085",
  },

  pickerContainer: {
    marginTop: 38,
  },

  infoRow: {
    marginTop: 20,
    paddingHorizontal: 4,

    flexDirection: "row",
    alignItems: "center",

    gap: 8,
  },

  infoText: {
    flex: 1,

    fontSize: 13,
    lineHeight: 19,

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

  continueText: {
    fontSize: 17,
    fontWeight: "700",

    color: "#FFFFFF",
  },
});
