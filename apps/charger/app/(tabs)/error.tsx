import React, { useMemo, useState } from "react";
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
import { SafeAreaView } from "react-native-safe-area-context";
import { useErrorLog } from "@/contexts/ErrorLogContext";

export default function ErrorPage() {
  const { logs, removeLogs } = useErrorLog();
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [filterText, setFilterText] = useState("");
  const [timeRange, setTimeRange] = useState<"all" | "24h" | "7d">("all");

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

  const renderItem = ({ item }) => {
    const checked = !!selected[item.id];
    return (
      <TouchableOpacity style={styles.item} onPress={() => toggle(item.id)}>
        <View style={[styles.checkbox, checked && styles.checkboxChecked]} />
        <View style={styles.itemText}>
          <Text style={styles.reason}>{item.reason}</Text>
          <Text style={styles.timestamp}>
            {new Date(item.timestamp).toLocaleString()}
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
      let matchTime = true;
      const t = new Date(l.timestamp).getTime();
      if (timeRange === "24h") matchTime = t >= now - 24 * 60 * 60 * 1000;
      if (timeRange === "7d") matchTime = t >= now - 7 * 24 * 60 * 60 * 1000;
      return matchText && matchTime;
    });
  }, [logs, filterText, timeRange]);

  return (
    <SafeAreaView style={styles.container}>
      {logs.length === 0 ? (
        <Text style={styles.empty}>目前沒有異常紀錄</Text>
      ) : (
        <>
          <View style={styles.filterSection}>
            <TextInput
              placeholder="搜尋原因"
              value={filterText}
              onChangeText={setFilterText}
              style={styles.searchInput}
            />
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
                  全部
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
                  24小時
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
                  7天
                </Text>
              </Pressable>
            </View>
          </View>
          {filteredLogs.length === 0 ? (
            <Text style={styles.empty}>沒有符合條件的紀錄</Text>
          ) : (
            <FlatList
              data={filteredLogs}
              renderItem={renderItem}
              keyExtractor={(item) => item.id}
            />
          )}
          <View style={styles.actions}>
            <Button
              title="刪除選取"
              onPress={deleteSelected}
              disabled={!hasSelection}
              color="#e53935"
            />
          </View>
        </>
      )}
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
  empty: { textAlign: "center", marginTop: 20, color: "#555" },
  filterSection: { marginBottom: 12 },
  searchInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginBottom: 8,
  },
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

  checkboxChecked: {
    backgroundColor: "#5c6bc0",
  },
  itemText: { flex: 1 },
  reason: { fontSize: 16, color: "#222" },
  timestamp: { fontSize: 12, color: "#666", marginTop: 4 },
  actions: { marginTop: 12 },
});
