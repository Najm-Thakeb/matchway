import {
  ActivityIndicator,
  Keyboard,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useEffect, useRef, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";

import { useOfferRideStore } from "../store/offerRideStore";

const MATCHWAY_RED = "#E63946";

type PlaceSuggestion = {
  placeId: string;
  mainText: string;
  secondaryText: string;
};

type ActiveField = "city" | "pickup";

export default function OfferScreen() {
  const {
    fromLabel,
    fromPlaceId,

    pickupLabel,
    pickupPlaceId,

    setFrom,
    setPickup,
  } = useOfferRideStore();

  const [cityQuery, setCityQuery] = useState(fromLabel);

  const [pickupQuery, setPickupQuery] = useState(pickupLabel);

  const [activeField, setActiveField] = useState<ActiveField>("city");

  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);

  const [loading, setLoading] = useState(false);

  const pickupInputRef = useRef<TextInput>(null);

  const currentQuery = activeField === "city" ? cityQuery : pickupQuery;

  useEffect(() => {
    const query = currentQuery.trim();

    if (query.length < 2) {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    if (activeField === "city" && query === fromLabel) {
      setSuggestions([]);
      return;
    }

    if (activeField === "pickup" && query === pickupLabel) {
      setSuggestions([]);
      return;
    }

    if (activeField === "pickup" && !fromPlaceId) {
      setSuggestions([]);
      return;
    }

    const timeout = setTimeout(async () => {
      try {
        setLoading(true);

        /*
            Beim genauen Abholpunkt hängen wir
            die ausgewählte Stadt an.

            Beispiel:
            "7th Circle"
                 ↓
            "7th Circle, Amman, Jordan"

            Dadurch bekommt Google passendere
            Ergebnisse.
          */
        const searchQuery =
          activeField === "pickup" ? `${query}, ${fromLabel}` : query;

        const response = await fetch(
          `http://localhost:3000/locations/autocomplete?q=${encodeURIComponent(
            searchQuery,
          )}`,
        );

        if (!response.ok) {
          throw new Error("Location search failed");
        }

        const data: PlaceSuggestion[] = await response.json();

        setSuggestions(data);
      } catch (error) {
        console.error("Offer location search error:", error);

        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 350);

    return () => clearTimeout(timeout);
  }, [currentQuery, activeField, fromLabel, fromPlaceId, pickupLabel]);

  function selectPlace(place: PlaceSuggestion) {
    const label = place.secondaryText
      ? `${place.mainText}, ${place.secondaryText}`
      : place.mainText;

    if (activeField === "city") {
      setFrom(label, place.placeId);

      setCityQuery(label);

      /*
        Wenn die Stadt geändert wird,
        ist der alte Pickup nicht mehr gültig.
      */
      setPickup("", "");
      setPickupQuery("");

      setSuggestions([]);

      setActiveField("pickup");

      setTimeout(() => {
        pickupInputRef.current?.focus();
      }, 100);

      return;
    }

    setPickup(label, place.placeId);

    setPickupQuery(label);

    setSuggestions([]);

    Keyboard.dismiss();
  }

  const canContinue = Boolean(fromPlaceId && pickupPlaceId);

  return (
    <SafeAreaView style={styles.container}>
      {/* BACK */}
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={25} color="#111827" />
      </TouchableOpacity>

      {/* PROGRESS */}
      <View style={styles.progressRow}>
        <View style={[styles.progressPart, styles.progressActive]} />

        <View style={styles.progressPart} />

        <View style={styles.progressPart} />

        <View style={styles.progressPart} />
      </View>

      <Text style={styles.title}>Where are you leaving from?</Text>

      {/* FROM + PICKUP */}
      <View style={styles.locationBox}>
        {/* CITY */}
        <View style={styles.field}>
          <View style={styles.fieldIcon}>
            <Ionicons name="location-outline" size={20} color={MATCHWAY_RED} />
          </View>

          <View style={styles.fieldContent}>
            <Text style={styles.label}>City</Text>

            <TextInput
              style={styles.input}
              value={cityQuery}
              onFocus={() => setActiveField("city")}
              onChangeText={(text) => {
                setActiveField("city");
                setCityQuery(text);

                setFrom("", "");
                setPickup("", "");
                setPickupQuery("");
              }}
              placeholder="City"
              placeholderTextColor="#98A2B3"
              autoCorrect={false}
            />
          </View>

          {fromPlaceId ? (
            <Ionicons name="checkmark-circle" size={22} color={MATCHWAY_RED} />
          ) : null}
        </View>

        <View style={styles.divider} />

        {/* EXACT PICKUP */}
        <View style={[styles.field, !fromPlaceId && styles.fieldDisabled]}>
          <View style={styles.fieldIcon}>
            <Ionicons
              name="navigate-outline"
              size={20}
              color={fromPlaceId ? MATCHWAY_RED : "#B7BDC7"}
            />
          </View>

          <View style={styles.fieldContent}>
            <Text style={styles.label}>Exact pickup point</Text>

            <TextInput
              ref={pickupInputRef}
              style={styles.input}
              value={pickupQuery}
              editable={Boolean(fromPlaceId)}
              onFocus={() => setActiveField("pickup")}
              onChangeText={(text) => {
                setActiveField("pickup");

                setPickupQuery(text);
                setPickup("", "");
              }}
              placeholder={
                fromPlaceId ? "Street, station or place" : "Select city first"
              }
              placeholderTextColor="#98A2B3"
              autoCorrect={false}
            />
          </View>

          {pickupPlaceId ? (
            <Ionicons name="checkmark-circle" size={22} color={MATCHWAY_RED} />
          ) : null}
        </View>
      </View>

      {/* LOADING */}
      {loading ? (
        <ActivityIndicator style={styles.loader} color={MATCHWAY_RED} />
      ) : null}

      {/* GOOGLE RESULTS */}
      <ScrollView
        style={styles.results}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {suggestions.map((place) => (
          <TouchableOpacity
            key={place.placeId}
            style={styles.suggestionRow}
            onPress={() => selectPlace(place)}
          >
            <View style={styles.suggestionIcon}>
              <Ionicons
                name={
                  activeField === "city"
                    ? "location-outline"
                    : "navigate-outline"
                }
                size={20}
                color="#667085"
              />
            </View>

            <View style={styles.suggestionText}>
              <Text style={styles.suggestionTitle}>{place.mainText}</Text>

              {place.secondaryText ? (
                <Text style={styles.suggestionSecondary}>
                  {place.secondaryText}
                </Text>
              ) : null}
            </View>

            <Ionicons name="chevron-forward" size={19} color="#98A2B3" />
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* CONTINUE */}
      <TouchableOpacity
        style={[styles.continueButton, !canContinue && styles.continueDisabled]}
        disabled={!canContinue}
        onPress={() => router.push("/offer-destination")}
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

    borderRadius: 22,

    alignItems: "center",
    justifyContent: "center",

    borderWidth: 1,
    borderColor: "#E5E7EB",

    marginTop: 6,
  },

  progressRow: {
    flexDirection: "row",

    gap: 5,

    marginTop: 24,
  },

  progressPart: {
    flex: 1,

    height: 4,

    borderRadius: 2,

    backgroundColor: "#ECEEF1",
  },

  progressActive: {
    backgroundColor: MATCHWAY_RED,
  },

  title: {
    fontSize: 30,
    lineHeight: 37,

    fontWeight: "700",

    color: "#111827",

    marginTop: 28,
    marginBottom: 28,
  },

  locationBox: {
    borderWidth: 1.5,
    borderColor: MATCHWAY_RED,

    borderRadius: 18,

    backgroundColor: "#FFFFFF",

    overflow: "hidden",
  },

  field: {
    minHeight: 72,

    flexDirection: "row",
    alignItems: "center",

    paddingHorizontal: 14,
  },

  fieldDisabled: {
    backgroundColor: "#FAFAFB",
  },

  fieldIcon: {
    width: 34,

    alignItems: "flex-start",
  },

  fieldContent: {
    flex: 1,
  },

  label: {
    fontSize: 12,
    fontWeight: "600",

    color: "#667085",

    marginBottom: 2,
  },

  input: {
    padding: 0,

    fontSize: 16,
    fontWeight: "600",

    color: "#111827",
  },

  divider: {
    height: 1,

    backgroundColor: "#EAECF0",

    marginLeft: 48,
    marginRight: 14,
  },

  loader: {
    marginTop: 20,
  },

  results: {
    flex: 1,

    marginTop: 10,
  },

  suggestionRow: {
    minHeight: 68,

    flexDirection: "row",
    alignItems: "center",

    borderBottomWidth: 1,
    borderBottomColor: "#EAECF0",
  },

  suggestionIcon: {
    width: 42,
    height: 42,

    borderRadius: 14,

    backgroundColor: "#F5F6F8",

    alignItems: "center",
    justifyContent: "center",

    marginRight: 12,
  },

  suggestionText: {
    flex: 1,
  },

  suggestionTitle: {
    fontSize: 16,
    fontWeight: "600",

    color: "#111827",
  },

  suggestionSecondary: {
    marginTop: 2,

    fontSize: 13,

    color: "#667085",
  },

  continueButton: {
    height: 58,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",

    gap: 8,

    backgroundColor: MATCHWAY_RED,

    borderRadius: 18,

    marginBottom: 10,
  },

  continueDisabled: {
    opacity: 0.35,
  },

  continueText: {
    fontSize: 17,
    fontWeight: "700",

    color: "#FFFFFF",
  },
});
