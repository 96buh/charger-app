import React, { useMemo, useState } from "react";
import { Button, View, Text, Pressable, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSettings } from "@/contexts/SettingsContext";
import i18n from "@/utils/i18n";

import {
  VictoryAxis,
  VictoryBar,
  VictoryChart,
  VictoryTheme,
  VictoryScatter,
} from "victory-native";

import { useChargeHistory } from "@/contexts/ChargeHistoryContext";

const DAY_MS = 24 * 60 * 60 * 1000;

export default function HistoryScreen() {
  const { history, clearHistory } = useChargeHistory();
  const { language } = useSettings();
  i18n.locale = language;
  const [range, setRange] = useState<7 | 30>(7);

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

  return (
    <SafeAreaView style={{ flex: 1, padding: 16 }}>
      <View style={styles.rangePicker}>
        <Pressable
          accessibilityRole="button"
          style={[styles.rangeOption, range === 7 && styles.rangeOptionActive]}
          onPress={() => setRange(7)}
        >
          <Text
            style={[styles.rangeText, range === 7 && styles.rangeTextActive]}
          >
            {i18n.t("days7")}
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          style={[styles.rangeOption, range === 30 && styles.rangeOptionActive]}
          onPress={() => setRange(30)}
        >
          <Text
            style={[styles.rangeText, range === 30 && styles.rangeTextActive]}
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
          <VictoryChart
            domainPadding={{ x: 20 }}
            height={300}
            theme={VictoryTheme.material}
          >
            <VictoryAxis tickFormat={(t) => t} />
            <VictoryAxis dependentAxis tickFormat={(t) => `${t}%`} />
            <VictoryBar
              data={chartData}
              style={{ data: { fill: "#4f46e5" } }}
            />
          </VictoryChart>
          <VictoryChart
            domainPadding={{ x: 20 }}
            height={300}
            theme={VictoryTheme.material}
          >
            <VictoryAxis label="Minutes" />
            <VictoryAxis dependentAxis tickFormat={(t) => `${t}%`} label="%" />
            <VictoryScatter
              data={scatterData}
              size={4}
              style={{ data: { fill: "#10b981" } }}
            />
          </VictoryChart>
        </>
      )}
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
});
