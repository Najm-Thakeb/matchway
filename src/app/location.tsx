import { useRef, useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";

export default function LocationScreen() {
  const params = useLocalSearchParams<{
    mode?: "from" | "to";
  }>();

  const [searchText, setSearchText] = useState("");

  const inputRef = useRef<TextInput>(null);

  const title =
    params.mode === "to"
      ? "Where are you going?"
      : "Where are you leaving from?";

  function clearSearch() {
    setSearchText("");
    inputRef.current?.focus();
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
});
