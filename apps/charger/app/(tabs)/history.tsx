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

import { CartesianChart, BarGroup, useChartPressState } from "victory-native";
import { useDevClock, DAY_MS as DAY_MS_UTIL } from "@/utils/devClock";
import DevClockControls from "@/components/DevClockControl";
import Animated, { useDerivedValue, runOnJS } from "react-native-reanimated";

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
  const { nowMs, offsetDays, shiftDays, reset } = useDevClock(); // ← 開發時鐘

  // ★ 新增：選中的「哪一天」（YYYY-MM-DD）；null = 不篩選
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  // 每天彙總：minutes(總充電分鐘)、percent(總補電百分點) + iso（YYYY-MM-DD） & x（本地化日期字串）
  const groupedData = useMemo(() => {
    const cutoff = nowMs - range * DAY_MS;
    const totals: Record<string, { minutes: number; percent: number }> = {};
    for (const s of history) {
      const ts = new Date(s.timestamp).getTime();
      if (ts >= cutoff) {
        const key = new Date(ts).toISOString().split("T")[0]; // YYYY-MM-DD
        if (!totals[key]) totals[key] = { minutes: 0, percent: 0 };
        totals[key].minutes += s.durationMin || 0;
        totals[key].percent += s.percent || 0;
      }
    }

    const locale = language === "zh" ? "zh-TW" : "en-US";
    const fmt = new Intl.DateTimeFormat(locale, {
      month: "numeric",
      day: "numeric",
    });

    // 生成連續日期
    // const days: string[] = [];
    // for (let i = range - 1; i >= 0; i--) {
    //   const d = new Date();
    //   d.setDate(d.getDate() - i);
    //   days.push(d.toISOString().split("T")[0]); // YYYY-MM-DD
    // }

    const days: string[] = []; // 以 dev clock 的「今天 00:00」為基準往回推
    const base = new Date(nowMs);
    base.setHours(0, 0, 0, 0);
    for (let i = range - 1; i >= 0; i--) {
      const d = new Date(base);
      d.setDate(base.getDate() - i);
      days.push(d.toISOString().split("T")[0]); // YYYY-MM-DD
    }

    return days.map((iso) => {
      const d = new Date(iso + "T00:00:00");
      return {
        iso, // 用來篩選
        x: fmt.format(d), // 顯示在 X 軸的字串（例如 8/23）
        minutes: Math.round(totals[iso]?.minutes ?? 0),
        percent: Math.round((totals[iso]?.percent ?? 0) * 10) / 10,
      };
    });
  }, [history, range, language]);

  // ★ 用手勢追蹤目前「指到哪個 X（日期字串）」；用它來設定 selectedDay
  const { state: pressState } = useChartPressState({
    x: "", // x 的型別要跟 xKey 一致，這裡是字串
    y: { minutes: 0, percent: 0 },
  });

  useDerivedValue(() => {
    const xVal = pressState.x.value; // 與 xKey 同型別（日期字串）
    if (!xVal) return;
    // 找到對應日期，切換列表篩選
    const hit = groupedData.find((d) => d.x === xVal);
    if (hit) {
      runOnJS(setSelectedDay)(hit.iso);
    }
  }, [groupedData]);

  // ★ 篩選出「所選日期」的 records（沒選就顯示全部）
  const filteredHistory = useMemo(() => {
    // const cutoff = Date.now() - range * DAY_MS;
    const cutoff = nowMs - range * DAY_MS;
    const list = history.filter((s) => {
      const ts = new Date(s.timestamp).getTime();
      if (ts < cutoff) return false;
      if (!selectedDay) return true;
      const key = new Date(ts).toISOString().split("T")[0];
      return key === selectedDay;
    });
    return [...list].sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    // }, [history, range, selectedDay]);
  }, [history, range, selectedDay, nowMs]);

  const selectedSummary = useMemo(() => {
    if (!selectedDay) return null;
    return groupedData.find((d) => d.iso === selectedDay) || null;
  }, [groupedData, selectedDay]);

  const renderItem = ({ item }: { item: ChargeSession }) => {
    const end = new Date(item.timestamp);
    const start = new Date(end.getTime() - item.durationMin * 60000);
    const date = `${String(start.getMonth() + 1).padStart(2, "0")}/${String(
      start.getDate()
    ).padStart(2, "0")}`;
    const startStr = start.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    const endStr = end.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    const from = Math.round(item.startPercent ?? 0);
    const to = Math.round(item.endPercent ?? from + item.percent);
    return (
      <Pressable
        accessibilityRole="button"
        onPress={() => setSelectedId(item.id)}
        style={[
          styles.recordItem,
          selectedId === item.id && styles.recordItemActive,
        ]}
      >
        <View style={styles.recordRow}>
          <Text
            style={styles.recordDate}
          >{`${date} ${startStr} - ${endStr}`}</Text>
          <Text style={styles.recordDetails}>
            {i18n.t("chargeDuration", { min: Math.round(item.durationMin) })}
          </Text>
        </View>
        <View style={styles.recordRow}>
          <Text style={styles.recordDetails}>
            {i18n.t("fromToPercent", { from, to })}
          </Text>
          <Text style={styles.recordDetails}>+{Math.round(item.percent)}%</Text>
        </View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <FlatList
        data={filteredHistory}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        extraData={`${selectedId}-${selectedDay}`}
        contentContainerStyle={{ padding: 16 }}
        ListHeaderComponent={
          <View>
            {/* 範圍切換 */}
            <View style={styles.rangePicker}>
              <Pressable
                accessibilityRole="button"
                style={[
                  styles.rangeOption,
                  range === 7 && styles.rangeOptionActive,
                ]}
                onPress={() => {
                  setRange(7);
                  setSelectedDay(null);
                }}
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
                onPress={() => {
                  setRange(30);
                  setSelectedDay(null);
                }}
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

            {/* 清除紀錄 */}
            <View style={{ marginBottom: 16, alignItems: "center" }}>
              <Button
                title={i18n.t("clearHistory")}
                onPress={clearHistory}
                disabled={history.length === 0}
              />
            </View>
            <DevClockControls
              nowMs={nowMs}
              offsetDays={offsetDays}
              onShift={shiftDays}
              onReset={reset}
              labelToday={i18n.locale === "zh" ? "回到今天" : "Today"}
            />

            {history.length === 0 ? (
              <Text style={{ textAlign: "center" }}>{i18n.t("noHistory")}</Text>
            ) : (
              <>
                {/* 圖表 */}
                <View style={{ height: 300 }}>
                  <CartesianChart
                    style={{ flex: 1 }}
                    data={groupedData}
                    xKey="x"
                    yKeys={["minutes", "percent"]}
                    padding={{ left: 20, right: 20, top: 8, bottom: 24 }}
                    domainPadding={{ top: 20, left: 20, right: 20 }}
                    axisOptions={{
                      formatXLabel: (t) => t,
                      formatYLabel: (t) => `${t}`,
                    }}
                    // ★ 啟用 press 手勢追蹤
                    chartPressState={pressState}
                  >
                    {({ points, chartBounds }) => (
                      <BarGroup
                        chartBounds={chartBounds}
                        betweenGroupPadding={0.3}
                        withinGroupPadding={0.12}
                      >
                        <BarGroup.Bar
                          points={points.minutes ?? []}
                          color="#10b981"
                        />
                        <BarGroup.Bar
                          points={points.percent ?? []}
                          color="#4f46e5"
                        />
                      </BarGroup>
                    )}
                  </CartesianChart>
                </View>

                {/* 選中日期的摘要（相當於 tooltip 的資訊區） */}
                <View style={{ alignItems: "center", marginTop: 8 }}>
                  {selectedSummary ? (
                    <Text style={{ color: "#374151" }}>
                      {selectedSummary.x} ·{" "}
                      {i18n.t("legendMinutes") || "充電時間（分鐘）"}：
                      {selectedSummary.minutes}，
                      {i18n.t("legendPercent") || "補電量（百分點）"}：
                      {selectedSummary.percent}%
                    </Text>
                  ) : (
                    <Text style={{ color: "#6b7280" }}>
                      {language === "zh"
                        ? "在圖上長按/滑動選一天"
                        : "Press/slide on chart to select a day"}
                    </Text>
                  )}
                </View>

                {/* 圖例 */}
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "center",
                    gap: 12,
                    marginTop: 8,
                  }}
                >
                  <Legend
                    color="#10b981"
                    label={i18n.t("legendMinutes") || "充電時間（分鐘）"}
                  />
                  <Legend
                    color="#4f46e5"
                    label={i18n.t("legendPercent") || "補電量（百分點）"}
                  />
                </View>

                {/* 清除日期篩選 */}
                {selectedDay && (
                  <View style={{ alignItems: "center", marginTop: 8 }}>
                    <Pressable onPress={() => setSelectedDay(null)}>
                      <Text style={{ color: "#4f46e5" }}>
                        {language === "zh"
                          ? "清除日期篩選"
                          : "Clear date filter"}
                      </Text>
                    </Pressable>
                  </View>
                )}
              </>
            )}
          </View>
        }
        ListEmptyComponent={<View />}
      />
    </SafeAreaView>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
      <View
        style={{
          width: 12,
          height: 12,
          backgroundColor: color,
          borderRadius: 2,
        }}
      />
      <Text>{label}</Text>
    </View>
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
  recordRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  axisInfo: {
    textAlign: "center",
    marginTop: 4,
    color: "#374151",
  },
});
