import { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useSearchStore } from "../store/searchStore";

const MATCHWAY_RED = "#E63946";

export default function PassengersScreen() {
  const { passengers: savedPassengers, setPassengers } = useSearchStore();

  const [passengers, setLocalPassengers] = useState(savedPassengers);

  function closeScreen() {
    router.back();
  }

  function confirmPassengers() {
    setPassengers(passengers);
    router.back();
  }

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity onPress={closeScreen}>
        <Text style={styles.close}>✕</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Number of passengers</Text>

      <View style={styles.counter}>
        <TouchableOpacity
          style={[
            styles.counterButton,
            passengers === 1 && styles.disabledButton,
          ]}
          disabled={passengers === 1}
          onPress={() => setLocalPassengers(passengers - 1)}
        >
          <Text style={styles.counterSymbol}>−</Text>
        </TouchableOpacity>

        <Text style={styles.number}>{passengers}</Text>

        <TouchableOpacity
          style={styles.counterButton}
          onPress={() => setLocalPassengers(passengers + 1)}
        >
          <Text style={styles.counterSymbol}>+</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.confirmButton}
        onPress={confirmPassengers}
      >
        <Text style={styles.confirmText}>Confirm</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: "#FFFFFF",
  },

  close: {
    fontSize: 32,
  },

  title: {
    fontSize: 32,
    fontWeight: "bold",
    marginTop: 50,
  },

  counter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 80,
  },

  counterButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: MATCHWAY_RED,
    alignItems: "center",
    justifyContent: "center",
  },

  disabledButton: {
    opacity: 0.3,
  },

  counterSymbol: {
    fontSize: 30,
    color: MATCHWAY_RED,
  },

  number: {
    fontSize: 42,
    fontWeight: "bold",
  },

  confirmButton: {
    marginTop: "auto",
    padding: 18,
    borderRadius: 30,
    backgroundColor: MATCHWAY_RED,
    alignItems: "center",
  },

  confirmText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
  },
});
