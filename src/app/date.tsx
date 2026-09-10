import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { useSearchStore } from "../store/searchStore";

const MATCHWAY_RED = "#E63946";

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

function isSameDay(date1: Date, date2: Date) {
  return date1.getTime() === date2.getTime();
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

  // Wenn noch keine Abfahrt gewählt wurde,
  // gilt automatisch heute.
  const parsedDepartureDate = parseDate(departureDate) ?? today;

  // Return ist leer, bis der Nutzer etwas auswählt.
  const parsedReturnDate = parseDate(returnDate);

  /*
   * Departure:
   * - nichts gewählt -> Heute komplett rot
   * - Datum gewählt -> ausgewähltes Datum komplett rot
   *
   * Return:
   * - nichts gewählt -> kein Tag komplett rot
   * - Datum gewählt -> ausgewähltes Datum komplett rot
   */
  const selectedDate = isReturnMode ? parsedReturnDate : parsedDepartureDate;

  // Aktueller Monat + nächste 2 Monate
  const months = Array.from({ length: 3 }, (_, index) => {
    const monthDate = new Date(
      today.getFullYear(),
      today.getMonth() + index,
      1,
    );

    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();

    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const firstDay = new Date(year, month, 1).getDay();

    // Kalender beginnt bei Montag
    const emptyDays = (firstDay + 6) % 7;

    const days = [
      ...Array(emptyDays).fill(null),
      ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
    ];

    return {
      year,
      month,
      days,
    };
  });

  function selectDate(dayDate: Date) {
    // RETURN
    if (isReturnMode) {
      setReturnDate(dayDate.toISOString());
      router.back();
      return;
    }

    // DEPARTURE
    // Falls Return danach ungültig wäre, Return löschen.
    if (parsedReturnDate && parsedReturnDate < dayDate) {
      clearReturnDate();
    }

    setDepartureDate(dayDate.toISOString());
    router.back();
  }

  function closeCalendar() {
    router.back();
  }

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity onPress={closeCalendar}>
        <Text style={styles.close}>✕</Text>
      </TouchableOpacity>

      <Text style={styles.title}>
        {isReturnMode ? "When are you coming back?" : "When are you leaving?"}
      </Text>

      <View style={styles.weekRow}>
        <Text style={styles.weekDay}>Mon</Text>
        <Text style={styles.weekDay}>Tue</Text>
        <Text style={styles.weekDay}>Wed</Text>
        <Text style={styles.weekDay}>Thu</Text>
        <Text style={styles.weekDay}>Fri</Text>
        <Text style={styles.weekDay}>Sat</Text>
        <Text style={styles.weekDay}>Sun</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {months.map((monthData) => {
          const monthDate = new Date(monthData.year, monthData.month, 1);

          const monthName = monthDate.toLocaleDateString("en-US", {
            month: "long",
          });

          const showYear = monthData.year !== today.getFullYear();

          return (
            <View
              key={`${monthData.year}-${monthData.month}`}
              style={styles.monthContainer}
            >
              <Text style={styles.month}>
                {monthName}
                {showYear ? ` ${monthData.year}` : ""}
              </Text>

              <View style={styles.daysGrid}>
                {monthData.days.map((day, index) => {
                  if (!day) {
                    return <View key={index} style={styles.dayCell} />;
                  }

                  const dayDate = normalizeDate(
                    new Date(monthData.year, monthData.month, day),
                  );

                  // Vergangenheit deaktivieren
                  const isPast = dayDate < today;

                  // Bei Return:
                  // Tage vor Departure deaktivieren
                  const isBeforeDeparture =
                    isReturnMode && dayDate < parsedDepartureDate;

                  const isDisabled = isPast || isBeforeDeparture;

                  const isToday = isSameDay(dayDate, today);

                  const isSelected =
                    selectedDate !== null && isSameDay(dayDate, selectedDate);

                  return (
                    <View key={index} style={styles.dayCell}>
                      <TouchableOpacity
                        style={[
                          styles.dayButton,

                          // Heute nur Rand,
                          // wenn heute nicht ausgewählt ist
                          isToday && !isSelected && styles.todayButton,

                          // Auswahl komplett rot
                          isSelected && styles.selectedDayButton,
                        ]}
                        disabled={isDisabled}
                        onPress={() => selectDate(dayDate)}
                      >
                        <Text
                          style={[
                            styles.dayText,

                            isDisabled && styles.disabledDayText,

                            isSelected && styles.selectedDayText,
                          ]}
                        >
                          {day}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
            </View>
          );
        })}
      </ScrollView>
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
    marginBottom: 30,
  },

  title: {
    fontSize: 32,
    fontWeight: "bold",
  },

  weekRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 30,
    marginBottom: 10,
  },

  weekDay: {
    width: 40,
    textAlign: "center",
    fontSize: 13,
  },

  monthContainer: {
    marginBottom: 35,
  },

  month: {
    fontSize: 22,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 15,
  },

  daysGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },

  dayCell: {
    width: "14.28%",
    height: 52,
    alignItems: "center",
    justifyContent: "center",
  },

  dayButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  todayButton: {
    borderWidth: 2,
    borderColor: MATCHWAY_RED,
  },

  selectedDayButton: {
    backgroundColor: MATCHWAY_RED,
  },

  dayText: {
    fontSize: 16,
    color: "#555F73",
  },

  disabledDayText: {
    color: "#C4C7CC",
  },

  selectedDayText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
});
