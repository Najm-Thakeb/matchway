import React from "react";
import {
  KeyboardAvoidingView,
  Platform,
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
const DARK = "#0B1633";
const GREY_TEXT = "#6B7280";
const BORDER = "#E5E7EB";
const LIGHT_RED = "#FDECEE";

export default function OfferPriceScreen() {
  const { pricePerSeat, setPricePerSeat } = useOfferRideStore();

  const priceValue = pricePerSeat ? String(pricePerSeat) : "";
  const isValid = Number(priceValue) > 0;

  function handleChangePrice(value: string) {
    const cleaned = value.replace(/[^0-9]/g, "");
    setPricePerSeat(cleaned);
  }

  function handleContinue() {
    if (!isValid) return;
    router.push("/offer-booking");
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={28} color={DARK} />
        </TouchableOpacity>

        <Text style={styles.title}>Set your price per seat</Text>

        <View style={styles.card}>
          <View style={styles.iconWrap}>
            <Ionicons name="cash-outline" size={30} color={MATCHWAY_RED} />
          </View>

          <View style={styles.priceRow}>
            <TextInput
              style={styles.priceInput}
              value={priceValue}
              onChangeText={handleChangePrice}
              keyboardType="number-pad"
              placeholder="0"
              placeholderTextColor="#C7CDD8"
              maxLength={3}
            />
            <Text style={styles.currency}>JOD</Text>
          </View>
        </View>

        <Text style={styles.infoText}>
          Passengers will see this price before booking your ride.
        </Text>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.continueButton,
              !isValid && styles.continueButtonDisabled,
            ]}
            onPress={handleContinue}
            activeOpacity={0.85}
            disabled={!isValid}
          >
            <Text style={styles.continueText}>Continue</Text>
            <Ionicons name="arrow-forward" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  keyboard: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 10,
  },

  backButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 28,
  },

  title: {
    fontSize: 32,
    fontWeight: "800",
    color: DARK,
    lineHeight: 40,
    marginBottom: 28,
  },

  card: {
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 28,
    paddingHorizontal: 24,
    paddingVertical: 28,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 250,
  },

  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: LIGHT_RED,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },

  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  priceInput: {
    minWidth: 90,
    fontSize: 56,
    fontWeight: "800",
    color: DARK,
    textAlign: "right",
    paddingVertical: 0,
  },

  currency: {
    fontSize: 28,
    fontWeight: "800",
    color: MATCHWAY_RED,
    marginLeft: 14,
  },

  infoText: {
    marginTop: 18,
    fontSize: 15,
    lineHeight: 22,
    color: GREY_TEXT,
  },

  footer: {
    marginTop: "auto",
    paddingBottom: 24,
    paddingTop: 20,
  },

  continueButton: {
    height: 72,
    borderRadius: 24,
    backgroundColor: MATCHWAY_RED,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 10,
  },

  continueButtonDisabled: {
    opacity: 0.35,
  },

  continueText: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "800",
  },
});
