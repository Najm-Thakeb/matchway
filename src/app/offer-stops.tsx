import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useEffect, useState } from "react";
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

export default function OfferStopsScreen() {
  const {
    pickupLabel,
    pickupPlaceId,

    dropoffLabel,
    dropoffPlaceId,

    stops,
    addStop,
    removeStop,
  } = useOfferRideStore();

  const [query, setQuery] = useState("");

  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const searchText = query.trim();

    if (searchText.length < 2) {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    const timeout = setTimeout(async () => {
      try {
        setLoading(true);

        const response = await fetch(
          `http://localhost:3000/locations/autocomplete?q=${encodeURIComponent(
            searchText,
          )}`,
        );

        if (!response.ok) {
          throw new Error("Stop search failed");
        }

        const data: PlaceSuggestion[] = await response.json();

        /*
            Pickup, Drop-off und bereits
            hinzugefügte Stopps nicht
            nochmal anzeigen.
          */
        const filtered = data.filter((place) => {
          if (place.placeId === pickupPlaceId) {
            return false;
          }

          if (place.placeId === dropoffPlaceId) {
            return false;
          }

          const alreadyAdded = stops.some(
            (stop) => stop.placeId === place.placeId,
          );

          return !alreadyAdded;
        });

        setSuggestions(filtered);
      } catch (error) {
        console.error("Stop search error:", error);

        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 350);

    return () => clearTimeout(timeout);
  }, [query, pickupPlaceId, dropoffPlaceId, stops]);

  function selectStop(place: PlaceSuggestion) {
    const label = place.secondaryText
      ? `${place.mainText}, ${place.secondaryText}`
      : place.mainText;

    addStop(label, place.placeId);

    setQuery("");
    setSuggestions([]);
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* BACK */}
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={25} color="#111827" />
      </TouchableOpacity>

      {/* TITLE */}
      <View style={styles.titleRow}>
        <Text style={styles.title}>Add stops</Text>

        <View style={styles.optionalBadge}>
          <Text style={styles.optionalText}>Optional</Text>
        </View>
      </View>

      <Text style={styles.subtitle}>
        Add places where you plan to stop along the way.
      </Text>

      {/* ROUTE */}
      <View style={styles.routeCard}>
        {/* PICKUP */}
        <View style={styles.routeRow}>
          <View style={styles.startDot} />

          <View style={styles.routeTextBox}>
            <Text style={styles.routeLabel}>Pickup</Text>

            <Text style={styles.routeText} numberOfLines={1}>
              {pickupLabel}
            </Text>
          </View>
        </View>

        {/* STOPS */}
        {stops.map((stop) => (
          <View key={stop.placeId}>
            <View style={styles.line} />

            <View style={styles.routeRow}>
              <View style={styles.stopDot} />

              <View style={styles.routeTextBox}>
                <Text style={styles.routeLabel}>Stop</Text>

                <Text style={styles.routeText} numberOfLines={1}>
                  {stop.label}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => removeStop(stop.placeId)}
              >
                <Ionicons name="close" size={20} color="#667085" />
              </TouchableOpacity>
            </View>
          </View>
        ))}

        <View style={styles.line} />

        {/* DROP-OFF */}
        <View style={styles.routeRow}>
          <View style={styles.endDot} />

          <View style={styles.routeTextBox}>
            <Text style={styles.routeLabel}>Drop-off</Text>

            <Text style={styles.routeText} numberOfLines={1}>
              {dropoffLabel}
            </Text>
          </View>
        </View>
      </View>

      {/* SEARCH STOP */}
      <View style={styles.searchBox}>
        <Ionicons name="add" size={22} color={MATCHWAY_RED} />

        <TextInput
          style={styles.input}
          value={query}
          onChangeText={setQuery}
          placeholder="Add a stop"
          placeholderTextColor="#98A2B3"
          autoCorrect={false}
        />

        {query.length > 0 ? (
          <TouchableOpacity
            onPress={() => {
              setQuery("");
              setSuggestions([]);
            }}
          >
            <Ionicons name="close-circle" size={21} color="#98A2B3" />
          </TouchableOpacity>
        ) : null}
      </View>

      {loading ? (
        <ActivityIndicator style={styles.loader} color={MATCHWAY_RED} />
      ) : null}

      {/* SUGGESTIONS */}
      <ScrollView
        style={styles.results}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {suggestions.map((place) => (
          <TouchableOpacity
            key={place.placeId}
            style={styles.suggestionRow}
            onPress={() => selectStop(place)}
          >
            <View style={styles.suggestionIcon}>
              <Ionicons name="location-outline" size={20} color="#667085" />
            </View>

            <View style={styles.suggestionText}>
              <Text style={styles.suggestionTitle}>{place.mainText}</Text>

              {place.secondaryText ? (
                <Text style={styles.suggestionSecondary}>
                  {place.secondaryText}
                </Text>
              ) : null}
            </View>

            <Ionicons
              name="add-circle-outline"
              size={22}
              color={MATCHWAY_RED}
            />
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* CONTINUE */}
      <TouchableOpacity
        style={styles.continueButton}
        onPress={() => {
          router.push("/offer-date-time");
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
    borderRadius: 22,

    alignItems: "center",
    justifyContent: "center",

    borderWidth: 1,
    borderColor: "#E5E7EB",

    marginTop: 6,
  },

  titleRow: {
    flexDirection: "row",
    alignItems: "center",

    marginTop: 26,

    gap: 10,
  },

  title: {
    fontSize: 30,
    fontWeight: "700",
    color: "#111827",
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

  subtitle: {
    marginTop: 6,
    marginBottom: 20,

    fontSize: 14,
    color: "#667085",
  },

  routeCard: {
    borderWidth: 1,
    borderColor: "#E4E7EC",

    borderRadius: 18,

    padding: 16,

    backgroundColor: "#FFFFFF",
  },

  routeRow: {
    minHeight: 42,

    flexDirection: "row",
    alignItems: "center",
  },

  routeTextBox: {
    flex: 1,
  },

  routeLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#667085",
  },

  routeText: {
    marginTop: 2,

    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },

  startDot: {
    width: 10,
    height: 10,

    borderRadius: 5,

    borderWidth: 2,
    borderColor: MATCHWAY_RED,

    backgroundColor: "#FFFFFF",

    marginRight: 13,
  },

  stopDot: {
    width: 10,
    height: 10,

    borderRadius: 5,

    backgroundColor: "#FFFFFF",

    borderWidth: 2,
    borderColor: "#667085",

    marginRight: 13,
  },

  endDot: {
    width: 10,
    height: 10,

    borderRadius: 5,

    backgroundColor: MATCHWAY_RED,

    marginRight: 13,
  },

  line: {
    width: 2,
    height: 20,

    backgroundColor: "#D9DDE3",

    marginLeft: 4,
  },

  removeButton: {
    width: 36,
    height: 36,

    alignItems: "center",
    justifyContent: "center",
  },

  searchBox: {
    height: 58,

    flexDirection: "row",
    alignItems: "center",

    marginTop: 16,

    paddingHorizontal: 15,

    borderWidth: 1.5,
    borderColor: MATCHWAY_RED,

    borderRadius: 17,
  },

  input: {
    flex: 1,

    marginLeft: 9,

    fontSize: 16,
    fontWeight: "500",

    color: "#111827",
  },

  loader: {
    marginTop: 16,
  },

  results: {
    flex: 1,

    marginTop: 8,
  },

  suggestionRow: {
    minHeight: 66,

    flexDirection: "row",
    alignItems: "center",

    borderBottomWidth: 1,
    borderBottomColor: "#EAECF0",
  },

  suggestionIcon: {
    width: 40,
    height: 40,

    borderRadius: 13,

    backgroundColor: "#F5F6F8",

    alignItems: "center",
    justifyContent: "center",

    marginRight: 11,
  },

  suggestionText: {
    flex: 1,
  },

  suggestionTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
  },

  suggestionSecondary: {
    marginTop: 2,

    fontSize: 13,
    color: "#667085",
  },

  continueButton: {
    height: 56,

    marginTop: 10,
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
