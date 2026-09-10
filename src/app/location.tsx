import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { useSearchStore } from "../store/searchStore";

type PlaceSuggestion = {
  placeId: string;
  mainText: string;
  secondaryText: string;
};

export default function LocationScreen() {
  const { setFrom, setTo } = useSearchStore();
  const params = useLocalSearchParams<{
    mode?: "from" | "to";

    fromLabel?: string;
    fromPlaceId?: string;

    toLabel?: string;
    toPlaceId?: string;

    departureDate?: string;
    returnDate?: string;
    passengers?: string;
  }>();

  const [searchText, setSearchText] = useState("");
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [loading, setLoading] = useState(false);

  const inputRef = useRef<TextInput>(null);

  const title =
    params.mode === "to"
      ? "Where are you going?"
      : "Where are you leaving from?";

  useEffect(() => {
    if (searchText.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(() => {
      searchLocations(searchText);
    }, 400);

    return () => clearTimeout(timer);
  }, [searchText]);

  async function searchLocations(query: string) {
    try {
      setLoading(true);

      const response = await fetch(
        `http://localhost:3000/locations/autocomplete?q=${encodeURIComponent(
          query,
        )}`,
      );

      if (!response.ok) {
        throw new Error("Location search failed");
      }

      const data: PlaceSuggestion[] = await response.json();

      setSuggestions(data);
    } catch (error) {
      console.error("Location search error:", error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }

  function clearSearch() {
    setSearchText("");
    setSuggestions([]);
    inputRef.current?.focus();
  }

  function selectPlace(place: PlaceSuggestion) {
    const label = place.secondaryText
      ? `${place.mainText}, ${place.secondaryText}`
      : place.mainText;

    if (params.mode === "from") {
      setFrom(label, place.placeId);
    }

    if (params.mode === "to") {
      setTo(label, place.placeId);
    }

    router.back();
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>{title}</Text>

      <View style={styles.searchBox}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>

        <TextInput
          ref={inputRef}
          style={styles.input}
          placeholder="City, station or place"
          placeholderTextColor="#8B8F98"
          value={searchText}
          onChangeText={setSearchText}
          autoFocus
          autoCorrect={false}
          returnKeyType="search"
        />

        {searchText.length > 0 && (
          <TouchableOpacity style={styles.iconButton} onPress={clearSearch}>
            <Text style={styles.clearIcon}>×</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading && (
        <ActivityIndicator
          style={styles.loading}
          size="small"
          color="#E63946"
        />
      )}

      <View style={styles.results}>
        {suggestions.map((place) => (
          <TouchableOpacity
            key={place.placeId}
            style={styles.resultItem}
            onPress={() => selectPlace(place)}
          >
            <Text style={styles.mainText}>{place.mainText}</Text>

            <Text style={styles.secondaryText}>{place.secondaryText}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 24,
    paddingTop: 24,
  },

  title: {
    fontSize: 30,
    fontWeight: "700",
    color: "#111111",
    marginTop: 30,
    marginBottom: 28,
    lineHeight: 36,
  },

  searchBox: {
    height: 58,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F2F4",
    borderWidth: 2,
    borderColor: "#E63946",
    borderRadius: 18,
    paddingHorizontal: 10,
  },

  iconButton: {
    width: 34,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },

  backIcon: {
    fontSize: 36,
    color: "#333333",
    lineHeight: 38,
  },

  input: {
    flex: 1,
    height: "100%",
    paddingHorizontal: 8,
    fontSize: 18,
    color: "#111111",
  },

  clearIcon: {
    fontSize: 32,
    color: "#555B66",
    lineHeight: 34,
  },

  loading: {
    marginTop: 24,
  },

  results: {
    marginTop: 18,
  },

  resultItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E6E6E6",
  },

  mainText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111111",
  },

  secondaryText: {
    fontSize: 14,
    color: "#777777",
    marginTop: 4,
  },
});
