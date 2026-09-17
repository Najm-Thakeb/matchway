import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const MATCHWAY_RED = "#E63946";

type CalendarPickerProps = {
  selectedDate: Date | null;
  minDate?: Date;
  onSelectDate: (date: Date) => void;

  monthsToShow?: number;
};

function normalizeDate(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function isSameDay(date1: Date, date2: Date) {
  return normalizeDate(date1).getTime() === normalizeDate(date2).getTime();
}

export default function CalendarPicker({
  selectedDate,
  minDate,
  onSelectDate,
  monthsToShow = 3,
}: CalendarPickerProps) {
  const today = normalizeDate(new Date());

  const minimumDate = minDate ? normalizeDate(minDate) : today;

  const months = Array.from(
    {
      length: monthsToShow,
    },
    (_, index) => {
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

        ...Array.from(
          {
            length: daysInMonth,
          },
          (_, i) => i + 1,
        ),
      ];

      return {
        year,
        month,
        days,
      };
    },
  );

  return (
    <View style={styles.container}>
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

                  const isDisabled = dayDate < minimumDate;

                  const isToday = isSameDay(dayDate, today);

                  const isSelected =
                    selectedDate !== null && isSameDay(dayDate, selectedDate);

                  return (
                    <View key={index} style={styles.dayCell}>
                      <TouchableOpacity
                        style={[
                          styles.dayButton,

                          isToday && !isSelected && styles.todayButton,

                          isSelected && styles.selectedDayButton,
                        ]}
                        disabled={isDisabled}
                        onPress={() => onSelectDate(dayDate)}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  weekRow: {
    flexDirection: "row",
    justifyContent: "space-between",

    marginTop: 24,
    marginBottom: 10,
  },

  weekDay: {
    width: 40,

    textAlign: "center",

    fontSize: 13,
    color: "#667085",
  },

  monthContainer: {
    marginBottom: 20,
  },

  month: {
    fontSize: 22,
    fontWeight: "bold",

    marginTop: 20,
    marginBottom: 15,

    color: "#111827",
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
