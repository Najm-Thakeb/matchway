import { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";

import { useSearchStore } from "../store/searchStore";

const MATCHWAY_RED = "#E63946";

export default function PassengersScreen() {
  const { passengers: savedPassengers, setPassengers } = useSearchStore();

  const [passengers, setLocalPassengers] = useState(savedPassengers);

  function decrease() {
    if (passengers > 1) {
      setLocalPassengers(passengers - 1);
    }
  }

  function increase() {
    if (passengers < 8) {
      setLocalPassengers(passengers + 1);
    }
  }

  function confirm() {
    setPassengers(passengers);
    router.back();
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* CLOSE */}
      <TouchableOpacity
        style={styles.closeButton}
        onPress={() => router.back()}
        activeOpacity={0.7}
      >
        <Ionicons name="close" size={27} color="#111827" />
      </TouchableOpacity>

      {/* TITLE */}
      <Text style={styles.title}>How many seats do you need?</Text>

      {/* PASSENGER CARD */}
      <View style={styles.passengerCard}>
        <View style={styles.cardTop}>
          <Text style={styles.cardLabel}>Number of passengers</Text>

          <View style={styles.peopleIcon}>
            <Ionicons name="people-outline" size={24} color={MATCHWAY_RED} />
          </View>
        </View>

        <View style={styles.counterRow}>
          {/* MINUS */}
          <TouchableOpacity
            style={[
              styles.counterButton,
              passengers === 1 && styles.counterButtonDisabled,
            ]}
            onPress={decrease}
            disabled={passengers === 1}
            activeOpacity={0.75}
          >
            <Ionicons
              name="remove"
              size={28}
              color={passengers === 1 ? "#C8CDD5" : "#111827"}
            />
          </TouchableOpacity>

          {/* NUMBER */}
          <View style={styles.numberArea}>
            <Text style={styles.number}>{passengers}</Text>

            <Text style={styles.numberLabel}>
              {passengers === 1 ? "Passenger" : "Passengers"}
            </Text>
          </View>

          {/* PLUS */}
          <TouchableOpacity
            style={[
              styles.counterButton,
              styles.plusButton,
              passengers === 8 && styles.plusButtonDisabled,
            ]}
            onPress={increase}
            disabled={passengers === 8}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={28} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* CONFIRM */}
      <TouchableOpacity
        style={styles.confirmButton}
        onPress={confirm}
        activeOpacity={0.85}
      >
        <Text style={styles.confirmText}>Confirm</Text>
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

  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,

    alignItems: "center",
    justifyContent: "center",

    borderWidth: 1,
    borderColor: "#E5E7EB",

    marginTop: 6,
  },

  title: {
    marginTop: 36,
    marginBottom: 30,

    fontSize: 30,
    fontWeight: "700",
    color: "#111827",
  },

  passengerCard: {
    borderRadius: 22,

    borderWidth: 1,
    borderColor: "#E4E7EC",

    backgroundColor: "#FFFFFF",

    padding: 18,
  },

  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",

    marginBottom: 26,
  },

  cardLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },

  peopleIcon: {
    width: 44,
    height: 44,

    borderRadius: 22,

    backgroundColor: "#FFF1F2",

    alignItems: "center",
    justifyContent: "center",
  },

  counterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  counterButton: {
    width: 58,
    height: 58,

    borderRadius: 18,

    borderWidth: 1.5,
    borderColor: "#D9DDE3",

    backgroundColor: "#FFFFFF",

    alignItems: "center",
    justifyContent: "center",
  },

  counterButtonDisabled: {
    backgroundColor: "#F7F8FA",
    borderColor: "#ECEEF1",
  },

  plusButton: {
    backgroundColor: MATCHWAY_RED,
    borderColor: MATCHWAY_RED,
  },

  plusButtonDisabled: {
    opacity: 0.4,
  },

  numberArea: {
    alignItems: "center",
    justifyContent: "center",

    minWidth: 100,
  },

  number: {
    fontSize: 42,
    fontWeight: "700",
    color: "#111827",
  },

  numberLabel: {
    marginTop: -2,

    fontSize: 13,
    color: "#667085",
  },

  confirmButton: {
    height: 58,

    marginTop: 28,

    borderRadius: 18,

    backgroundColor: MATCHWAY_RED,

    alignItems: "center",
    justifyContent: "center",
  },

  confirmText: {
    fontSize: 17,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
