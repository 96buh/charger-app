import React, { useCallback, useEffect, useMemo, useState } from "react";
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

import {
  CartesianChart,
  BarGroup,
  Line as ChartLine,
  useChartPressState,
} from "victory-native";
import {
  useFont,
  Group,
  RoundedRect,
  Text as SkiaText,
  Circle,
} from "@shopify/react-native-skia";
import inter from "@/assets/fonts/SpaceMono-Regular.ttf";
import { useDevClock, DAY_MS } from "@/utils/devClock";
import DevClockControls from "@/components/DevClockControl";
import { useDerivedValue, runOnJS } from "react-native-reanimated";

import {
  useChargeHistory,
  ChargeSession,
} from "@/contexts/ChargeHistoryContext";
import { useHardwareData } from "@/contexts/HardwareContext";

function localIsoDate(ms: number) {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function HistoryScreen() {
  const { history, clearHistory } = useChargeHistory();
  const { language } = useSettings();
  i18n.locale = language;
  const { activeSession } = useHardwareData();

  const [range, setRange] = useState<7 | 30>(7);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { nowMs, offsetDays, shiftDays, reset } = useDevClock(); // ← 開發時鐘

  // ★ 新增：選中的「哪一天」（YYYY-MM-DD）；null = 不篩選
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [tooltipInfo, setTooltipInfo] = useState<{
    index: number;
    label: string;
    value: number;
    x: number;
    y: number;
  } | null>(null);

  // 每天彙總：minutes(總充電分鐘)、percent(總補電百分點) + iso（YYYY-MM-DD） & x（本地化日期字串）
  const groupedData = useMemo(() => {
    const cutoff = nowMs - range * DAY_MS;
    const totals: Record<string, { minutes: number; percent: number }> = {};
    for (const s of history) {
      const ts = new Date(s.timestamp).getTime();
      if (ts >= cutoff) {
        const key = localIsoDate(ts);
        if (!totals[key]) totals[key] = { minutes: 0, percent: 0 };
        totals[key].minutes += s.durationMin || 0;
        totals[key].percent += s.percent || 0;
      }
    }
    // 納入進行中的 session（即時）
    if (activeSession) {
      const iso = localIsoDate(nowMs);
      if (!totals[iso]) totals[iso] = { minutes: 0, percent: 0 };
      totals[iso].minutes += activeSession.liveDurationMin || 0;
      totals[iso].percent += activeSession.livePercent || 0;
    }

    const locale = language === "zh" ? "zh-TW" : "en-US";
    const fmt = new Intl.DateTimeFormat(locale, {
      month: "numeric",
      day: "numeric",
    });

    // 以 dev clock 的「今天 00:00」為基準往回推
    const days: string[] = [];
    const base = new Date(nowMs);
    base.setHours(0, 0, 0, 0);
    for (let i = range - 1; i >= 0; i--) {
      const d = new Date(base);
      d.setDate(base.getDate() - i);
      days.push(localIsoDate(d.getTime())); // YYYY-MM-DD（本地）
    }

    return days.map((iso) => {
      const d = new Date(iso + "T00:00:00");
      return {
        iso, // 用來篩選
        x: fmt.format(d), // 顯示在 X 軸的字串（例如 8/23）
        minutes: Math.round((totals[iso]?.minutes ?? 0) * 10) / 10,
        percent: Math.round((totals[iso]?.percent ?? 0) * 10) / 10,
      };
    });
  }, [history, range, language, nowMs, activeSession]);

  // ★ 用手勢追蹤目前「指到哪個 X（日期字串）」；用它來設定 tooltip 與 selectedDay
  const { state: pressState, isActive: pressIsActive } = useChartPressState({
    x: 0,
    y: { value: 0 },
  });

  const assignActiveIndex = useCallback((idx: number) => {
    setActiveIndex(idx);
  }, []);

  const clearActiveIndex = useCallback(() => {
    setActiveIndex(null);
    setTooltipInfo(null);
  }, []);

  useDerivedValue(() => {
    if (!pressIsActive.value) {
      runOnJS(clearActiveIndex)();
      return;
    }
    const xVal = Math.round(pressState.x.value);
    if (!Number.isFinite(xVal)) return;
    if (xVal < 0 || xVal >= groupedData.length) return;
    const hit = groupedData[xVal];
    if (hit) {
      const value = metric === "percent" ? hit.percent : hit.minutes;
      const xPos = pressState.x.position.value;
      const yPos = pressState.y.value.position.value;
      runOnJS(assignActiveIndex)(xVal);
      runOnJS(setTooltipInfo)({
        index: xVal,
        label: hit.x,
        value,
        x: xPos,
        y: yPos,
      });
    }
  }, [groupedData, metric, assignActiveIndex, clearActiveIndex]);

  useEffect(() => {
    if (activeIndex == null) return;
    const hit = groupedData[activeIndex];
    if (hit) {
      setSelectedDay(hit.iso);
    }
  }, [activeIndex, groupedData]);

  // ★ 篩選出「所選日期」的 records（沒選就顯示全部）
  const filteredHistory = useMemo(() => {
    // const cutoff = Date.now() - range * DAY_MS;
    const cutoff = nowMs - range * DAY_MS;
    const list = history.filter((s) => {
      const ts = new Date(s.timestamp).getTime();
      if (ts < cutoff) return false;
      if (!selectedDay) return true;
      const key = localIsoDate(ts);
      return key === selectedDay;
    });
    // 進行中的 session 作為臨時 record 顯示在列表
    if (activeSession) {
      const iso = localIsoDate(nowMs);
      if (!selectedDay || selectedDay === iso) {
        const liveItem: ChargeSession = {
          id: "live",
          timestamp: new Date(nowMs).toISOString(),
          percent: Math.max(0, Number(activeSession.livePercent.toFixed(1))),
          durationMin: Number(activeSession.liveDurationMin.toFixed(2)),
          startPercent: Math.round(activeSession.startPercent),
          endPercent: Math.round(
            activeSession.startPercent + activeSession.livePercent
          ),
        } as any;
        list.push(liveItem);
      }
    }
    return [...list].sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    // }, [history, range, selectedDay]);
  }, [history, range, selectedDay, nowMs, activeSession]);

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
          <Text style={styles.recordDetails}>
            +{(Math.round((item.percent ?? 0) * 10) / 10).toFixed(1)}%
          </Text>
        </View>
      </Pressable>
    );
  };

  // 圖表指標切換（避免兩個不同量綱共用一個 y 軸）
  const [metric, setMetric] = useState<"percent" | "minutes">("percent");

  // 圖表資料（只顯示單一指標）
  const chartData = useMemo(
    () =>
      groupedData.map((d, index) => ({
        index,
        label: d.x,
        value: metric === "percent" ? d.percent : d.minutes,
      })),
    [groupedData, metric]
  );

  const metricColor = useMemo(
    () => (metric === "percent" ? "#4f46e5" : "#10b981"),
    [metric]
  );

  const xDomain = useMemo(() => {
    if (chartData.length === 0) return [0, 1] as [number, number];
    return [-0.5, chartData.length - 0.5] as [number, number];
  }, [chartData.length]);

  const labelStep = useMemo(() => {
    if (range <= 10) return 1;
    if (range <= 20) return 2;
    return 5;
  }, [range]);

  useEffect(() => {
    setTooltipInfo(null);
    setActiveIndex(null);
  }, [metric, range]);

  const axisFont = useFont(inter, range > 20 ? 10 : 12);

  const tickValues = useMemo(() => {
    if (chartData.length === 0) return [] as number[];
    const values: number[] = [];
    chartData.forEach((_, idx) => {
      const isEdge = idx === 0 || idx === chartData.length - 1;
      if (isEdge || idx % labelStep === 0) {
        values.push(idx);
      }
    });
    return Array.from(new Set(values)).sort((a, b) => a - b);
  }, [chartData, labelStep]);

  const formatTick = useCallback(
    (value: number) => {
      const idx = Math.round(value);
      return chartData[idx]?.label ?? "";
    },
    [chartData]
  );

  const betweenGroupPadding = useMemo(() => {
    if (range > 20) return 0.03;
    if (range > 10) return 0.08;
    return 0.14;
  }, [range]);

  const withinGroupPadding = useMemo(() => {
    return range <= 10 ? 0.02 : 0.06;
  }, [range]);

  const explicitBarWidth = useMemo(() => {
    if (range <= 10) return 26;
    if (range <= 20) return 14;
    return undefined;
  }, [range]);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <FlatList
        data={filteredHistory}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        extraData={`${selectedId}-${selectedDay}-${metric}-${(
          activeSession?.livePercent ?? 0
        ).toFixed(1)}-${(activeSession?.liveDurationMin ?? 0).toFixed(2)}`}
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

            {/* 圖表指標切換 */}
            <View style={[styles.rangePicker, { marginTop: 8 }]}>
              <Pressable
                accessibilityRole="button"
                style={[
                  styles.rangeOption,
                  metric === "percent" && styles.rangeOptionActive,
                ]}
                onPress={() => setMetric("percent")}
              >
                <Text
                  style={[
                    styles.rangeText,
                    metric === "percent" && styles.rangeTextActive,
                  ]}
                >
                  {i18n.t("legendPercent") || "充電量 (%)"}
                </Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                style={[
                  styles.rangeOption,
                  metric === "minutes" && styles.rangeOptionActive,
                ]}
                onPress={() => setMetric("minutes")}
              >
                <Text
                  style={[
                    styles.rangeText,
                    metric === "minutes" && styles.rangeTextActive,
                  ]}
                >
                  {i18n.t("legendMinutes") || "充電時間 (分鐘)"}
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
            {__DEV__ && (
              <DevClockControls
                nowMs={nowMs}
                offsetDays={offsetDays}
                onShift={shiftDays}
                onReset={reset}
                labelToday={i18n.locale === "zh" ? "回到今天" : "Today"}
              />
            )}

            {history.length === 0 ? (
              <Text style={{ textAlign: "center" }}>{i18n.t("noHistory")}</Text>
            ) : (
              <>
                {/* 圖例 / 標題 */}
                <View style={{ alignItems: "center", marginBottom: 8 }}>
                  {metric === "minutes" ? (
                    <Legend
                      color="#10b981"
                      label={i18n.t("legendMinutes") || "充電時間（分鐘）"}
                    />
                  ) : (
                    <Legend
                      color="#4f46e5"
                      label={i18n.t("legendPercent") || "補電量（百分點）"}
                    />
                  )}
                </View>

                {/* 圖表 */}
                <View style={{ height: 300 }}>
                  <CartesianChart
                    style={{ flex: 1 }}
                    data={chartData}
                    xKey="index"
                    yKeys={["value"]}
                    padding={{
                      left: 16,
                      right: 16,
                      top: 8,
                      bottom: axisFont ? 32 : 24,
                    }}
                    domain={{ x: xDomain }}
                    domainPadding={{ top: 20 }}
                    xAxis={
                      axisFont
                        ? {
                            font: axisFont,
                            tickValues,
                            labelColor: "#4b5563",
                            labelOffset: 6,
                            axisSide: "bottom",
                            lineColor: "rgba(148, 163, 184, 0.4)",
                            lineWidth: 1,
                            formatXLabel: formatTick,
                          }
                        : undefined
                    }
                    yAxis={
                      axisFont
                        ? [
                            {
                              yKeys: ["value"],
                              font: axisFont,
                              tickCount: 5,
                              labelColor: "#4b5563",
                              labelOffset: 4,
                              axisSide: "left",
                              lineColor: "rgba(148, 163, 184, 0.35)",
                              lineWidth: 1,
                              formatYLabel: (val: number) => `${val}`,
                            },
                          ]
                        : undefined
                    }
                    // ★ 啟用 press 手勢追蹤
                    chartPressState={pressState}
                    renderOutside={({ chartBounds }) => {
                      if (!axisFont || !tooltipInfo) return null;
                      const clampedX = Math.min(
                        Math.max(tooltipInfo.x, chartBounds.left + 8),
                        chartBounds.right - 8
                      );
                      const clampedY = Math.min(
                        Math.max(tooltipInfo.y, chartBounds.top + 12),
                        chartBounds.bottom - 12
                      );
                      const minuteUnit = language === "zh" ? "分鐘" : "min";
                      const valueLine =
                        metric === "percent"
                          ? `${tooltipInfo.value.toFixed(1)}%`
                          : `${Math.round(tooltipInfo.value)} ${minuteUnit}`;
                      const labelLine = tooltipInfo.label;
                      const padX = 10;
                      const padY = 6;
                      const textHeight = axisFont.getSize();
                      const labelWidth = axisFont.getTextWidth(labelLine);
                      const valueWidth = axisFont.getTextWidth(valueLine);
                      const boxWidth =
                        Math.max(labelWidth, valueWidth) + padX * 2;
                      const boxHeight = textHeight * 2 + padY * 3;
                      const boxX = Math.min(
                        Math.max(clampedX - boxWidth / 2, chartBounds.left + 4),
                        chartBounds.right - boxWidth - 4
                      );
                      const boxY = Math.max(
                        clampedY - boxHeight - 14,
                        chartBounds.top + 4
                      );
                      return (
                        <Group>
                          <RoundedRect
                            x={boxX}
                            y={boxY}
                            width={boxWidth}
                            height={boxHeight}
                            r={6}
                            color="rgba(17,24,39,0.92)"
                          />
                          <SkiaText
                            text={labelLine}
                            x={boxX + padX}
                            y={boxY + padY + textHeight}
                            font={axisFont}
                            color="rgba(255,255,255,0.85)"
                          />
                          <SkiaText
                            text={valueLine}
                            x={boxX + padX}
                            y={boxY + padY * 2 + textHeight * 2}
                            font={axisFont}
                            color="white"
                          />
                        </Group>
                      );
                    }}
                  >
                    {({ points, chartBounds }) => {
                      const highlightIdx = tooltipInfo?.index ?? activeIndex;
                      const pointList = points.value ?? [];
                      const highlightPoint = pointList.find(
                        (pt) => Math.round(pt.xValue) === highlightIdx
                      );

                      if (range === 7) {
                        const barWidth = explicitBarWidth
                          ? explicitBarWidth
                          : (() => {
                              if (pointList.length < 2) {
                                return 24;
                              }
                              const xs = pointList
                                .map((p) => p.x)
                                .sort((a, b) => a - b);
                              const gapAvg =
                                xs.length > 1
                                  ? (xs[xs.length - 1] - xs[0]) /
                                    Math.max(xs.length - 1, 1)
                                  : 24;
                              return gapAvg * (1 - betweenGroupPadding * 1.2);
                            })();

                        return (
                          <>
                            <BarGroup
                              chartBounds={chartBounds}
                              betweenGroupPadding={betweenGroupPadding}
                              withinGroupPadding={withinGroupPadding}
                              barCount={chartData.length}
                              barWidth={explicitBarWidth}
                            >
                              <BarGroup.Bar
                                points={pointList}
                                color={metricColor}
                              />
                            </BarGroup>
                            {highlightPoint && barWidth ? (
                              <RoundedRect
                                x={highlightPoint.x - barWidth / 2}
                                y={highlightPoint.y}
                                width={barWidth}
                                height={chartBounds.bottom - highlightPoint.y}
                                r={4}
                                color={
                                  metric === "percent"
                                    ? "rgba(79,70,229,0.25)"
                                    : "rgba(16,185,129,0.25)"
                                }
                              />
                            ) : null}
                          </>
                        );
                      }

                      const verticalHeight = Math.max(
                        0,
                        chartBounds.bottom - chartBounds.top
                      );

                      return (
                        <Group>
                          <ChartLine
                            points={pointList}
                            color={metricColor}
                            strokeWidth={2}
                          />
                          {highlightPoint ? (
                            <Group>
                              <RoundedRect
                                x={highlightPoint.x - 1}
                                y={chartBounds.top}
                                width={2}
                                height={verticalHeight}
                                r={1}
                                color={
                                  metric === "percent"
                                    ? "rgba(79,70,229,0.35)"
                                    : "rgba(16,185,129,0.35)"
                                }
                              />
                              <Circle
                                cx={highlightPoint.x}
                                cy={highlightPoint.y}
                                r={6}
                                color={
                                  metric === "percent"
                                    ? "rgba(79,70,229,0.2)"
                                    : "rgba(16,185,129,0.2)"
                                }
                              />
                              <Circle
                                cx={highlightPoint.x}
                                cy={highlightPoint.y}
                                r={3.5}
                                color={metricColor}
                              />
                            </Group>
                          ) : null}
                        </Group>
                      );
                    }}
                  </CartesianChart>
                </View>

                {!axisFont && (
                  <View style={styles.xAxisLabelRow}>
                    {chartData.map((item, idx) => {
                      const isEdge = idx === 0 || idx === chartData.length - 1;
                      const showLabel = isEdge || idx % labelStep === 0;
                      return (
                        <Text
                          key={`${item.label}-${idx}`}
                          style={styles.xAxisLabel}
                          numberOfLines={1}
                        >
                          {showLabel ? item.label : ""}
                        </Text>
                      );
                    })}
                  </View>
                )}

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
  xAxisLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
    paddingHorizontal: 4,
  },
  xAxisLabel: {
    flex: 1,
    textAlign: "center",
    fontSize: 12,
    color: "#4b5563",
  },
});
