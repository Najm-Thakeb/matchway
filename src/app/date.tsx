import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";

export default function DateScreen() {
  const today = new Date();

  const todayWithoutTime = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );

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

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity onPress={() => router.replace("/")}>
        <Text style={styles.close}>✕</Text>
      </TouchableOpacity>

      <Text style={styles.title}>When are you leaving?</Text>

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

                  const dayDate = new Date(
                    monthData.year,
                    monthData.month,
                    day,
                  );

                  const isPast = dayDate < todayWithoutTime;

                  return (
                    <View key={index} style={styles.dayCell}>
                      <TouchableOpacity
                        style={styles.dayButton}
                        disabled={isPast}
                        onPress={() => {
                          const selectedDate = new Date(
                            monthData.year,
                            monthData.month,
                            day,
                          );

                          router.replace({
                            pathname: "/",
                            params: {
                              date: selectedDate.toISOString(),
                            },
                          });
                        }}
                      >
                        <Text
                          style={[styles.dayText, isPast && styles.pastDayText]}
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
    backgroundColor: "#ffffff",
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
    height: 50,
    alignItems: "center",
    justifyContent: "center",
  },

  dayButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },

  dayText: {
    fontSize: 16,
  },

  pastDayText: {
    color: "#bbbbbb",
  },
});
