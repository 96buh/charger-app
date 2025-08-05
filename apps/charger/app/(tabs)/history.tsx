import React, { useMemo, useState } from "react";
import { Button, View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  VictoryAxis,
  VictoryBar,
  VictoryChart,
  VictoryTheme,
} from "victory-native";

import { useChargeHistory } from "@/contexts/ChargeHistoryContext";

const DAY_MS = 24 * 60 * 60 * 1000;

export default function HistoryScreen() {
  const { history } = useChargeHistory();
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

  return (
    <SafeAreaView style={{ flex: 1, padding: 16 }}>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "center",
          marginBottom: 16,
        }}
      >
        <Button
          title="7天"
          onPress={() => setRange(7)}
          disabled={range === 7}
        />
        <View style={{ width: 8 }} />
        <Button
          title="30天"
          onPress={() => setRange(30)}
          disabled={range === 30}
        />
      </View>
      {history.length === 0 ? (
        <Text style={{ textAlign: "center" }}>沒有充電記錄</Text>
      ) : (
        <VictoryChart
          domainPadding={{ x: 20 }}
          height={300}
          theme={VictoryTheme.material}
        >
          <VictoryAxis tickFormat={(t) => t} />
          <VictoryAxis dependentAxis tickFormat={(t) => `${t}%`} />
          <VictoryBar data={chartData} style={{ data: { fill: "#4f46e5" } }} />
        </VictoryChart>
      )}
    </SafeAreaView>
  );
}
