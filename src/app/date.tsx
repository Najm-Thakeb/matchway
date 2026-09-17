import { StyleSheet, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";

import CalendarPicker from "../components/CalendarPicker";
import { useSearchStore } from "../store/searchStore";

function normalizeDate(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function parseDate(dateString?: string) {
  if (!dateString) {
    return null;
  }

  const parsedDate = new Date(dateString);

  if (isNaN(parsedDate.getTime())) {
    return null;
  }

  return normalizeDate(parsedDate);
}

export default function DateScreen() {
  const params = useLocalSearchParams<{
    mode?: "departure" | "return";
  }>();

  const {
    departureDate,
    returnDate,
    setDepartureDate,
    setReturnDate,
    clearReturnDate,
  } = useSearchStore();

  const today = normalizeDate(new Date());

  const isReturnMode = params.mode === "return";

  const parsedDepartureDate = parseDate(departureDate) ?? today;

  const parsedReturnDate = parseDate(returnDate);

  const selectedDate = isReturnMode ? parsedReturnDate : parsedDepartureDate;

  function selectDate(dayDate: Date) {
    // RETURN DATE
    if (isReturnMode) {
      setReturnDate(dayDate.toISOString());

      router.back();
      return;
    }

    // DEPARTURE DATE
    if (parsedReturnDate && parsedReturnDate < dayDate) {
      clearReturnDate();
    }

    setDepartureDate(dayDate.toISOString());

    router.back();
  }

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity onPress={() => router.back()}>
        <Text style={styles.close}>✕</Text>
      </TouchableOpacity>

      <Text style={styles.title}>
        {isReturnMode ? "When are you coming back?" : "When are you leaving?"}
      </Text>

      <CalendarPicker
        selectedDate={selectedDate}
        minDate={isReturnMode ? parsedDepartureDate : today}
        onSelectDate={selectDate}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
    backgroundColor: "#FFFFFF",
  },

  close: {
    fontSize: 32,
    marginBottom: 30,
  },

  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#111827",
  },
});
