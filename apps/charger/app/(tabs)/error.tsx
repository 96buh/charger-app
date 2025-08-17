import React, { useMemo, useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Button,
  TextInput,
  Pressable,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import { SafeAreaView } from "react-native-safe-area-context";
import { useErrorLog } from "@/contexts/ErrorLogContext";
import { useSettings } from "@/contexts/SettingsContext";
import i18n from "@/utils/i18n";

const startOfDay = (d: Date) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};
const endOfDay = (d: Date) => {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
};

type LogItem = {
  id: string;
  reason: string;
  type: string;
  timestamp: string | number | Date;
};

export default function ErrorPage() {
  const { logs, removeLogs } = useErrorLog();
  const { language } = useSettings();
  i18n.locale = language;

  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [filterText, setFilterText] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [timeRange, setTimeRange] = useState<"all" | "24h" | "7d" | "custom">(
    "all"
  );

  const [customStart, setCustomStart] = useState<Date>(() =>
    startOfDay(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
  );
  const [customEnd, setCustomEnd] = useState<Date>(() => endOfDay(new Date()));
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const types = useMemo(
    () => Array.from(new Set(logs.map((l) => l.type))),
    [logs]
  );

  const toggle = (id: string) => {
    setSelected((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const deleteSelected = () => {
    const ids = Object.entries(selected)
      .filter(([_, v]) => v)
      .map(([id]) => id);
    if (ids.length > 0) {
      removeLogs(ids);
      setSelected({});
    }
  };

  const renderItem = ({ item }: { item: LogItem }) => {
    const checked = !!selected[item.id];
    return (
      <TouchableOpacity style={styles.item} onPress={() => toggle(item.id)}>
        <View style={[styles.checkbox, checked && styles.checkboxChecked]} />
        <View style={styles.itemText}>
          <Text style={styles.reason}>{item.reason}</Text>
          <Text style={styles.timestamp}>
            {new Date(item.timestamp).toLocaleString([], {
              hour12: false,
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const hasSelection = Object.values(selected).some((v) => v);

  const filteredLogs = useMemo(() => {
    const now = Date.now();
    return logs.filter((l) => {
      const matchText = l.reason
        .toLowerCase()
        .includes(filterText.toLowerCase());
      const matchType = selectedType === "all" || l.type === selectedType;
      const t = new Date(l.timestamp).getTime();
      let matchTime = true;
      if (timeRange === "24h") matchTime = t >= now - 24 * 60 * 60 * 1000;
      if (timeRange === "7d") matchTime = t >= now - 7 * 24 * 60 * 60 * 1000;
      if (timeRange === "custom") {
        matchTime = t >= customStart.getTime() && t <= customEnd.getTime();
      }
      return matchText && matchTime && matchType;
    });
  }, [logs, filterText, selectedType, timeRange, customStart, customEnd]);

  const selectAll = () => {
    const all: Record<string, boolean> = {};
    filteredLogs.forEach((l) => {
      all[l.id] = true;
    });
    setSelected(all);
  };
  const clearSelection = () => setSelected({});

  const selectCustom = () => {
    const end = endOfDay(new Date());
    const start = startOfDay(new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000));
    setCustomStart(start);
    setCustomEnd(end);
    setTimeRange("custom");
  };

  useEffect(() => {
    if (timeRange === "custom" && customStart.getTime() > customEnd.getTime()) {
      setCustomEnd(endOfDay(customStart));
    }
  }, [timeRange, customStart, customEnd]);

  const emptyText =
    logs.length === 0 ? i18n.t("noErrorLogs") : i18n.t("noMatchingLogs");

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.filterSection}>
        <TextInput
          placeholder={i18n.t("searchReason")}
          value={filterText}
          onChangeText={setFilterText}
          style={styles.searchInput}
        />

        <Picker
          selectedValue={selectedType}
          onValueChange={(v) => setSelectedType(v)}
          style={styles.typePicker}
        >
          <Picker.Item label={i18n.t("allTypes") as string} value="all" />
          {types.map((t) => (
            <Picker.Item key={t} label={t} value={t} />
          ))}
        </Picker>

        <View style={styles.rangePicker}>
          <Pressable
            accessibilityRole="button"
            style={[
              styles.rangeOption,
              timeRange === "all" && styles.rangeOptionActive,
            ]}
            onPress={() => setTimeRange("all")}
          >
            <Text
              style={[
                styles.rangeText,
                timeRange === "all" && styles.rangeTextActive,
              ]}
            >
              {i18n.t("all")}
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            style={[
              styles.rangeOption,
              timeRange === "24h" && styles.rangeOptionActive,
            ]}
            onPress={() => setTimeRange("24h")}
          >
            <Text
              style={[
                styles.rangeText,
                timeRange === "24h" && styles.rangeTextActive,
              ]}
            >
              {i18n.t("hours24")}
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            style={[
              styles.rangeOption,
              timeRange === "7d" && styles.rangeOptionActive,
            ]}
            onPress={() => setTimeRange("7d")}
          >
            <Text
              style={[
                styles.rangeText,
                timeRange === "7d" && styles.rangeTextActive,
              ]}
            >
              {i18n.t("days7")}
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            style={[
              styles.rangeOption,
              timeRange === "custom" && styles.rangeOptionActive,
            ]}
            onPress={selectCustom}
          >
            <Text
              style={[
                styles.rangeText,
                timeRange === "custom" && styles.rangeTextActive,
              ]}
            >
              {i18n.t("custom")}
            </Text>
          </Pressable>
        </View>

        {timeRange === "custom" && (
          <View style={styles.customRangeRow}>
            <Pressable
              style={styles.dateButton}
              onPress={() => setShowStartPicker(true)}
            >
              <Text style={styles.dateButtonText}>
                {customStart.toLocaleDateString()}
              </Text>
            </Pressable>

            <Text style={styles.rangeSeparator}>~</Text>

            <Pressable
              style={styles.dateButton}
              onPress={() => setShowEndPicker(true)}
            >
              <Text style={styles.dateButtonText}>
                {customEnd.toLocaleDateString()}
              </Text>
            </Pressable>

            {showStartPicker && (
              <DateTimePicker
                value={customStart}
                mode="date"
                display="default"
                onChange={(event, date) => {
                  setShowStartPicker(false);
                  if (date) setCustomStart(startOfDay(date));
                }}
              />
            )}

            {showEndPicker && (
              <DateTimePicker
                value={customEnd}
                mode="date"
                display="default"
                onChange={(event, date) => {
                  setShowEndPicker(false);
                  if (date) setCustomEnd(endOfDay(date));
                }}
              />
            )}
          </View>
        )}
      </View>

      <View style={styles.content}>
        <FlatList
          data={filteredLogs}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          style={styles.list}
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 8 }}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Text style={styles.empty}>{emptyText}</Text>
            </View>
          }
        />
      </View>

      <View style={styles.actions}>
        <Button
          title={i18n.t("selectAll")}
          onPress={selectAll}
          disabled={filteredLogs.length === 0}
        />
        <Button
          title={i18n.t("clearSelection")}
          onPress={clearSelection}
          disabled={!hasSelection}
        />
        <Button
          title={i18n.t("deleteSelection")}
          onPress={deleteSelected}
          disabled={!hasSelection}
          color="#e53935"
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },

  // 空訊息文字
  empty: { textAlign: "center", color: "#555" },

  // 篩選區
  filterSection: { marginBottom: 12 },
  searchInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginBottom: 8,
  },
  typePicker: { marginBottom: 8 },
  rangePicker: {
    flexDirection: "row",
    alignSelf: "center",
    borderWidth: 1,
    borderColor: "#4f46e5",
    borderRadius: 8,
    overflow: "hidden",
  },
  rangeOption: { flex: 1, paddingVertical: 6, backgroundColor: "#fff" },
  rangeOptionActive: { backgroundColor: "#4f46e5" },
  rangeText: { textAlign: "center", color: "#4f46e5" },
  rangeTextActive: { color: "#fff" },

  customRangeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  dateButton: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    minWidth: 120,
  },
  dateButtonText: {
    textAlign: "center",
    color: "#333",
    fontSize: 14,
  },
  rangeSeparator: { marginHorizontal: 8, color: "#4f46e5" },

  content: { flex: 1 },
  list: { flex: 1 },
  emptyWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  // 清單項目
  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: "#ccc",
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: "#555",
    borderRadius: 3,
    marginRight: 12,
  },
  checkboxChecked: { backgroundColor: "#5c6bc0" },
  itemText: { flex: 1 },
  reason: { fontSize: 16, color: "#222" },
  timestamp: { fontSize: 12, color: "#666", marginTop: 4 },

  actions: {
    marginTop: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#e5e7eb",
    backgroundColor: "#fff",
  },
});
