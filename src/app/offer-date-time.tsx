import {
  Alert,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";

import CalendarPicker from "../components/CalendarPicker";
import { useOfferRideStore } from "../store/offerRideStore";

const MATCHWAY_RED = "#E63946";

function normalizeDate(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function parseDate(dateString: string) {
  if (!dateString) {
    return null;
  }

  const date = new Date(dateString);

  if (isNaN(date.getTime())) {
    return null;
  }

  return normalizeDate(date);
}

function formatTime(date: Date) {
  const hours = String(date.getHours()).padStart(2, "0");

  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${hours}:${minutes}`;
}

function timeStringToDate(time: string) {
  const date = new Date();

  if (!time) {
    return date;
  }

  const [hours, minutes] = time.split(":").map(Number);

  date.setHours(hours, minutes, 0, 0);

  return date;
}

export default function OfferDateTimeScreen() {
  const { departureDate, departureTime, setDepartureDate, setDepartureTime } =
    useOfferRideStore();

  const today = normalizeDate(new Date());

  const selectedDate = parseDate(departureDate) ?? today;

  const [showTimePicker, setShowTimePicker] = useState(false);

  function selectDate(date: Date) {
    setDepartureDate(date.toISOString());
  }

  function selectTime(event: DateTimePickerEvent, selectedTime?: Date) {
    if (Platform.OS === "android") {
      setShowTimePicker(false);
    }

    if (event.type === "dismissed" || !selectedTime) {
      return;
    }

    setDepartureTime(formatTime(selectedTime));
  }

  function continueToNextStep() {
    if (!departureTime) {
      Alert.alert("Select a time", "Please choose your departure time.");

      return;
    }

    const [hours, minutes] = departureTime.split(":").map(Number);

    const departure = new Date(selectedDate);

    departure.setHours(hours, minutes, 0, 0);

    if (departure.getTime() <= Date.now()) {
      Alert.alert(
        "Invalid departure time",
        "Please choose a future departure time.",
      );

      return;
    }

    router.push("/offer-seats");
  }

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={25} color="#111827" />
      </TouchableOpacity>

      <Text style={styles.title}>When are you leaving?</Text>

      <Text style={styles.subtitle}>Choose your departure date and time.</Text>

      {/* SCROLLABLE CALENDAR */}
      <View style={styles.calendar}>
        <CalendarPicker
          selectedDate={selectedDate}
          minDate={today}
          onSelectDate={selectDate}
          monthsToShow={3}
        />
      </View>

      {/* DIVIDER */}
      <View style={styles.divider} />

      {/* TIME */}
      <View style={styles.timeSection}>
        <Text style={styles.timeLabel}>Departure time</Text>

        <TouchableOpacity
          style={styles.timeButton}
          onPress={() => setShowTimePicker(!showTimePicker)}
        >
          <View style={styles.timeLeft}>
            <Ionicons name="time-outline" size={25} color={MATCHWAY_RED} />

            <Text
              style={[
                styles.timeText,

                !departureTime && styles.placeholderText,
              ]}
            >
              {departureTime || "Select time"}
            </Text>
          </View>

          <Ionicons name="chevron-down" size={21} color="#667085" />
        </TouchableOpacity>

        {showTimePicker ? (
          <DateTimePicker
            value={timeStringToDate(departureTime)}
            mode="time"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            minuteInterval={5}
            onChange={selectTime}
          />
        ) : null}
      </View>

      {/* CONTINUE */}
      <TouchableOpacity
        style={[
          styles.continueButton,

          !departureTime && styles.continueButtonDisabled,
        ]}
        disabled={!departureTime}
        onPress={continueToNextStep}
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

  title: {
    marginTop: 24,

    fontSize: 30,
    fontWeight: "700",

    color: "#111827",
  },

  subtitle: {
    marginTop: 6,

    fontSize: 14,
    color: "#667085",
  },

  calendar: {
    height: 385,
    marginTop: 2,
  },

  divider: {
    height: 1,
    backgroundColor: "#E5E7EB",

    marginTop: 4,
    marginBottom: 16,
  },

  timeSection: {
    marginTop: 0,
  },

  timeLabel: {
    marginBottom: 10,

    fontSize: 20,
    fontWeight: "700",

    color: "#111827",
  },

  timeButton: {
    height: 62,

    borderWidth: 1.5,
    borderColor: "#E4E7EC",

    borderRadius: 17,

    paddingHorizontal: 16,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",

    backgroundColor: "#FFFFFF",
  },

  timeLeft: {
    flexDirection: "row",
    alignItems: "center",

    gap: 11,
  },

  timeText: {
    fontSize: 19,
    fontWeight: "700",

    color: "#111827",
  },

  placeholderText: {
    color: "#98A2B3",
    fontWeight: "600",
  },

  continueButton: {
    height: 56,

    marginTop: 16,
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
