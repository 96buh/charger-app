import React, { useMemo, useState } from "react";
import {
  Button,
  View,
  Text,
  Pressable,
  StyleSheet,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSettings } from "@/contexts/SettingsContext";
import i18n from "@/utils/i18n";

import { CartesianChart, Bar, Scatter } from "victory-native";

import {
  useChargeHistory,
  ChargeSession,
} from "@/contexts/ChargeHistoryContext";

const DAY_MS = 24 * 60 * 60 * 1000;

export default function HistoryScreen() {
  const { history, clearHistory } = useChargeHistory();
  const { language } = useSettings();
  i18n.locale = language;
  const [range, setRange] = useState<7 | 30>(7);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const chartData = useMemo(() => {
    const cutoff = Date.now() - range * DAY_MS;
    const totals: Record<string, number> = {};
    history.forEach((s) => {
      const date = new Date(s.timestamp);
      if (date.getTime() >= cutoff) {
        const key = date.toISOString().split("T")[0];
        totals[key] = (totals[key] || 0) + s.percent;
      }
    });

    const days: string[] = [];
    for (let i = range - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split("T")[0];
      days.push(key);
    }

    return days.map((d) => ({ x: d.slice(5), y: totals[d] || 0 }));
  }, [history, range]);

  const scatterData = useMemo(() => {
    const cutoff = Date.now() - range * DAY_MS;
    return history
      .filter((s) => new Date(s.timestamp).getTime() >= cutoff)
      .map((s) => ({ x: s.durationMin || 0, y: s.percent }));
  }, [history, range]);

  const sortedHistory = useMemo(
    () =>
      [...history].sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      ),
    [history]
  );

  const renderItem = ({ item }: { item: ChargeSession }) => (
    <Pressable
      accessibilityRole="button"
      onPress={() => setSelectedId(item.id)}
      style={[
        styles.recordItem,
        selectedId === item.id && styles.recordItemActive,
      ]}
    >
      <Text style={styles.recordDate}>
        {new Date(item.timestamp).toLocaleString()}
      </Text>
      <Text style={styles.recordDetails}>
        {item.percent}% · {item.durationMin}m
      </Text>
    </Pressable>
  );

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <FlatList
        data={sortedHistory}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        extraData={selectedId}
        contentContainerStyle={{ padding: 16 }}
        ListHeaderComponent={
          <>
            <View style={styles.rangePicker}>
              <Pressable
                accessibilityRole="button"
                style={[
                  styles.rangeOption,
                  range === 7 && styles.rangeOptionActive,
                ]}
                onPress={() => setRange(7)}
              >
                <Text
                  style={[
                    styles.rangeText,
                    range === 7 && styles.rangeTextActive,
                  ]}
                >
                  {i18n.t("days7")}
                </Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                style={[
                  styles.rangeOption,
                  range === 30 && styles.rangeOptionActive,
                ]}
                onPress={() => setRange(30)}
              >
                <Text
                  style={[
                    styles.rangeText,
                    range === 30 && styles.rangeTextActive,
                  ]}
                >
                  {i18n.t("days30")}
                </Text>
              </Pressable>
            </View>
            <View style={{ marginBottom: 16, alignItems: "center" }}>
              <Button
                title={i18n.t("clearHistory")}
                onPress={clearHistory}
                disabled={history.length === 0}
              />
            </View>
            {history.length === 0 ? (
              <Text style={{ textAlign: "center" }}>{i18n.t("noHistory")}</Text>
            ) : (
              <>
                <View style={{ height: 300 }}>
                  <CartesianChart
                    style={{ flex: 1 }}
                    data={chartData}
                    xKey="x"
                    yKeys={["y"]}
                    padding={20}
                    domainPadding={{ top: 20, left: 20, right: 20 }}
                    axisOptions={{
                      formatXLabel: (t) => t,
                      formatYLabel: (t) => `${t}%`,
                    }}
                  >
                    {({ points }) => <Bar points={points.y} color="#4f46e5" />}
                  </CartesianChart>
                </View>
                <View style={{ height: 300 }}>
                  <CartesianChart
                    style={{ flex: 1 }}
                    data={scatterData}
                    xKey="x"
                    yKeys={["y"]}
                    padding={20}
                    domainPadding={{ top: 20, left: 20, right: 20 }}
                    axisOptions={{
                      formatXLabel: (t) => `${t}`,
                      formatYLabel: (t) => `${t}%`,
                    }}
                  >
                    {({ points }) => (
                      <Scatter points={points.y} color="#10b981" radius={4} />
                    )}
                  </CartesianChart>
                </View>
              </>
            )}
          </>
        }
        ListEmptyComponent={<></>}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  rangePicker: {
    flexDirection: "row",
    alignSelf: "center",
    borderWidth: 1,
    borderColor: "#4f46e5",
    borderRadius: 8,
    overflow: "hidden",
    marginBottom: 16,
  },
  rangeOption: {
    flex: 1,
    paddingVertical: 8,
    backgroundColor: "#fff",
  },
  rangeOptionActive: {
    backgroundColor: "#4f46e5",
  },
  rangeText: {
    textAlign: "center",
    color: "#4f46e5",
  },
  rangeTextActive: {
    color: "#fff",
  },
  recordItem: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderColor: "#e5e7eb",
  },
  recordItemActive: {
    backgroundColor: "#e0e7ff",
  },
  recordDate: {
    fontWeight: "500",
  },
  recordDetails: {
    color: "#374151",
  },
});
