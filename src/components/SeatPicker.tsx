import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

const MATCHWAY_RED = "#E63946";

type SeatPickerProps = {
  value: number;
  onChange: (value: number) => void;

  label: string;

  singularLabel: string;
  pluralLabel: string;

  min?: number;
  max?: number;
};

export default function SeatPicker({
  value,
  onChange,
  label,
  singularLabel,
  pluralLabel,
  min = 1,
  max = 8,
}: SeatPickerProps) {
  function decrease() {
    if (value > min) {
      onChange(value - 1);
    }
  }

  function increase() {
    if (value < max) {
      onChange(value + 1);
    }
  }

  return (
    <View style={styles.card}>
      <View style={styles.iconBox}>
        <Ionicons name="people-outline" size={30} color={MATCHWAY_RED} />
      </View>

      <Text style={styles.label}>{label}</Text>

      <View style={styles.counterRow}>
        {/* MINUS */}
        <TouchableOpacity
          style={[
            styles.counterButton,
            value === min && styles.counterButtonDisabled,
          ]}
          disabled={value === min}
          onPress={decrease}
        >
          <Ionicons
            name="remove"
            size={28}
            color={value === min ? "#B7BDC7" : "#111827"}
          />
        </TouchableOpacity>

        {/* NUMBER */}
        <View style={styles.numberBox}>
          <Text style={styles.number}>{value}</Text>

          <Text style={styles.seatText}>
            {value === 1 ? singularLabel : pluralLabel}
          </Text>
        </View>

        {/* PLUS */}
        <TouchableOpacity
          style={[
            styles.counterButton,
            styles.plusButton,
            value === max && styles.plusButtonDisabled,
          ]}
          disabled={value === max}
          onPress={increase}
        >
          <Ionicons name="add" size={28} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingVertical: 30,
    paddingHorizontal: 20,

    borderWidth: 1,
    borderColor: "#E4E7EC",

    borderRadius: 22,

    alignItems: "center",

    backgroundColor: "#FFFFFF",
  },

  iconBox: {
    width: 58,
    height: 58,

    borderRadius: 18,

    backgroundColor: "#FFF1F2",

    alignItems: "center",
    justifyContent: "center",
  },

  label: {
    marginTop: 14,

    fontSize: 17,
    fontWeight: "600",

    color: "#344054",
  },

  counterRow: {
    marginTop: 28,

    flexDirection: "row",
    alignItems: "center",

    gap: 24,
  },

  counterButton: {
    width: 58,
    height: 58,

    borderRadius: 29,

    borderWidth: 1.5,
    borderColor: "#D0D5DD",

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: "#FFFFFF",
  },

  counterButtonDisabled: {
    backgroundColor: "#F7F8FA",
  },

  plusButton: {
    borderColor: MATCHWAY_RED,
    backgroundColor: MATCHWAY_RED,
  },

  plusButtonDisabled: {
    opacity: 0.45,
  },

  numberBox: {
    minWidth: 80,
    alignItems: "center",
  },

  number: {
    fontSize: 42,
    fontWeight: "700",

    color: "#111827",
  },

  seatText: {
    marginTop: 2,

    fontSize: 14,
    fontWeight: "500",

    color: "#667085",
  },
});
