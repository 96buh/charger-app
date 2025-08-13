import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Button,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useErrorLog } from "@/contexts/ErrorLogContext";

export default function ErrorPage() {
  const { logs, removeLogs } = useErrorLog();
  const [selected, setSelected] = useState<Record<string, boolean>>({});

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

  return (
    <SafeAreaView style={styles.container}>
      {logs.length === 0 ? (
        <Text style={styles.empty}>目前沒有異常紀錄</Text>
      ) : (
        <>
          <FlatList
            data={logs}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
          />
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
