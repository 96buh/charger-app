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
import { Pie, PolarChart } from "victory-native";
import { useFont } from "@shopify/react-native-skia";
import inter from "@/assets/fonts/SpaceMono-Regular.ttf";

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
  reasonKey?: string;
  reasonParams?: Record<string, unknown>;
  typeKey?: string;
};

type TemperatureSeverity = "normal" | "caution" | "danger";

type LocalizedLog = LogItem & {
  reasonText: string;
  typeText: string;
  normalizedTypeKey: string;
  temperatureC?: number;
  temperatureSeverity?: TemperatureSeverity;
};

const KNOWN_ERROR_TYPES = [
  "rustedCable",
  "rustedTransformer",
  "temperatureAbnormal",
  "unknown",
];

const PIE_COLORS = ["#ef4444", "#8b5cf6", "#f97316", "#22c55e", "#0ea5e9"];

const TYPE_KEY_LOOKUP: Record<string, string> = {
  未充電: "notCharging",
  正常: "normal",
  未知: "unknown",
  充電線生鏽: "rustedCable",
  變壓器生鏽: "rustedTransformer",
  "Not Charging": "notCharging",
  Normal: "normal",
  Unknown: "unknown",
  "Cable Rust": "rustedCable",
  "Transformer Rust": "rustedTransformer",
  "Temperature Abnormal": "temperatureAbnormal",
  溫度異常: "temperatureAbnormal",
};

const REASON_KEY_TO_TYPE: Record<string, string> = {
  tempOverThreshold: "temperatureAbnormal",
  errorReasonRustedCable: "rustedCable",
  errorReasonRustedTransformer: "rustedTransformer",
  errorReasonTemperature: "temperatureAbnormal",
};

const TEMPERATURE_KEYWORDS = ["temperature", "溫度"];

const TAG_COLOR_PALETTE: Record<
  "blue" | "yellow" | "red",
  { backgroundColor: string; color: string }
> = {
  blue: { backgroundColor: "#dbeafe", color: "#1d4ed8" },
  yellow: { backgroundColor: "#fef08a", color: "#854d0e" },
  red: { backgroundColor: "#fee2e2", color: "#b91c1c" },
};

const TEMPERATURE_COLORS: Record<TemperatureSeverity, { backgroundColor: string; color: string }> = {
  danger: TAG_COLOR_PALETTE.red,
  caution: TAG_COLOR_PALETTE.yellow,
  normal: TAG_COLOR_PALETTE.blue,
};

const TYPE_TAG_COLORS: Record<string, { backgroundColor: string; color: string }> = {
  rustedCable: TAG_COLOR_PALETTE.yellow,
  rustedTransformer: TAG_COLOR_PALETTE.red,
  notCharging: TAG_COLOR_PALETTE.blue,
  normal: TAG_COLOR_PALETTE.blue,
  unknown: TAG_COLOR_PALETTE.blue,
};

const DEFAULT_TAG_COLOR = TAG_COLOR_PALETTE.blue;

const toNumber = (value: unknown): number | undefined => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
};

const classifyTemperature = (temp?: number): TemperatureSeverity | undefined => {
  if (typeof temp !== "number") return undefined;
  if (temp >= 50) return "danger";
  if (temp >= 40) return "caution";
  return "normal";
};

const getTagColors = (log: LocalizedLog) => {
  if (log.normalizedTypeKey === "temperatureAbnormal") {
    const severity = log.temperatureSeverity ?? classifyTemperature(log.temperatureC);
    if (severity) {
      return TEMPERATURE_COLORS[severity];
    }
    return TEMPERATURE_COLORS.normal;
  }
  return TYPE_TAG_COLORS[log.normalizedTypeKey] ?? DEFAULT_TAG_COLOR;
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

  const localizedLogs: LocalizedLog[] = useMemo(() => {
    const locale = language;
    return logs.map((log) => {
      const inferredFromReason = log.reasonKey
        ? REASON_KEY_TO_TYPE[log.reasonKey]
        : undefined;
      let normalizedTypeKey =
        log.typeKey ||
        TYPE_KEY_LOOKUP[log.type] ||
        inferredFromReason ||
        TYPE_KEY_LOOKUP[log.reason] ||
        "";

      if (!normalizedTypeKey) {
        const matchesTemperature = TEMPERATURE_KEYWORDS.some((keyword) =>
          String(log.reason).toLowerCase().includes(keyword)
        );
        if (matchesTemperature) {
          normalizedTypeKey = "temperatureAbnormal";
        }
      }

      if (!normalizedTypeKey) {
        normalizedTypeKey = "unknown";
      }

      const params = (log.reasonParams ?? {}) as Record<string, unknown>;
      const measuredTemp = toNumber(
        params["measuredTemp"] ??
          params["measured"] ??
          params["temperature"] ??
          params["currentTemp"]
      );
      const thresholdTemp = toNumber(
        params["temp"] ?? params["threshold"] ?? params["targetTemp"]
      );
      const temperatureC = measuredTemp ?? thresholdTemp;
      const temperatureSeverity =
        normalizedTypeKey === "temperatureAbnormal"
          ? classifyTemperature(temperatureC)
          : undefined;

      const translationOptions = log.reasonParams
        ? { locale, ...(log.reasonParams as Record<string, unknown>) }
        : { locale };

      const reasonText = log.reasonKey
        ? i18n.t(log.reasonKey, translationOptions)
        : log.reason;

      const typeText = i18n.t(normalizedTypeKey, { locale });

      return {
        ...log,
        reasonText: typeof reasonText === "string" ? reasonText : String(reasonText),
        typeText: typeof typeText === "string" ? typeText : String(typeText),
        normalizedTypeKey,
        temperatureC,
        temperatureSeverity,
      };
    });
  }, [logs, language]);

  const typeOptions = useMemo(() => {
    const map = new Map<string, string>();
    localizedLogs.forEach((log) => {
      map.set(log.normalizedTypeKey, log.typeText);
    });
    const ordered: [string, string][] = [];
    KNOWN_ERROR_TYPES.forEach((key) => {
      const label = map.get(key);
      if (label) {
        ordered.push([key, label]);
        map.delete(key);
      }
    });
    map.forEach((label, key) => {
      ordered.push([key, label]);
    });
    return ordered;
  }, [localizedLogs]);

  useEffect(() => {
    if (selectedType === "all") return;
    const available = typeOptions.map(([key]) => key);
    if (!available.includes(selectedType)) {
      setSelectedType("all");
    }
  }, [typeOptions, selectedType]);

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

  const renderItem = ({ item }: { item: LocalizedLog }) => {
    const checked = !!selected[item.id];
    const pillColors = getTagColors(item);
    return (
      <TouchableOpacity style={styles.item} onPress={() => toggle(item.id)}>
        <View style={[styles.checkbox, checked && styles.checkboxChecked]} />
        <View style={styles.itemText}>
          <Text style={styles.reason}>{item.reasonText}</Text>
          <Text style={[styles.typePill, pillColors]}>{item.typeText}</Text>
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
    return localizedLogs.filter((l) => {
      const matchText = l.reasonText
        .toLowerCase()
        .includes(filterText.toLowerCase());
      const matchType =
        selectedType === "all" || l.normalizedTypeKey === selectedType;
      const t = new Date(l.timestamp).getTime();
      let matchTime = true;
      if (timeRange === "24h") matchTime = t >= now - 24 * 60 * 60 * 1000;
      if (timeRange === "7d") matchTime = t >= now - 7 * 24 * 60 * 60 * 1000;
      if (timeRange === "custom") {
        matchTime = t >= customStart.getTime() && t <= customEnd.getTime();
      }
      return matchText && matchTime && matchType;
    });
  }, [
    localizedLogs,
    filterText,
    selectedType,
    timeRange,
    customStart,
    customEnd,
  ]);

  const errorChartData = useMemo(() => {
    if (filteredLogs.length === 0) return [];

    const locale = language;

    const counts = new Map<string, number>();
    filteredLogs.forEach((log) => {
      const key = log.normalizedTypeKey || "unknown";
      counts.set(key, (counts.get(key) ?? 0) + 1);
    });

    const data: {
      typeKey: string;
      label: string;
      value: number;
      color: string;
      percent?: number;
    }[] = [];

    KNOWN_ERROR_TYPES.forEach((key, index) => {
      const count = counts.get(key);
      if (count && count > 0) {
        data.push({
          typeKey: key,
          label: String(i18n.t(key, { locale })),
          value: count,
          color: PIE_COLORS[index % PIE_COLORS.length],
        });
        counts.delete(key);
      }
    });

    let others = 0;
    counts.forEach((count) => {
      others += count;
    });
    if (others > 0) {
      data.push({
        typeKey: "other",
        label: String(i18n.t("errorOther", { locale })),
        value: others,
        color: PIE_COLORS[data.length % PIE_COLORS.length],
      });
    }

    const total = data.reduce((sum, item) => sum + item.value, 0);
    return data.map((item) => ({
      ...item,
      percent: total ? Math.round((item.value / total) * 100) : 0,
    }));
  }, [filteredLogs, language]);

  const pieSummary = useMemo(() => {
    if (errorChartData.length === 0) return null;
    const total = errorChartData.reduce((sum, item) => sum + item.value, 0);
    const top = errorChartData.reduce((prev, item) =>
      item.value > prev.value ? item : prev
    );
    const percent = total === 0 ? 0 : top.percent ?? Math.round((top.value / total) * 100);
    return { total, topLabel: top.label, percent };
  }, [errorChartData]);

  const pieFont = useFont(inter, 12);

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
          {typeOptions.map(([key, label]) => (
            <Picker.Item key={key} label={String(label)} value={key} />
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
          ListHeaderComponent={
            <View style={styles.chartSection}>
              <Text style={styles.chartTitle}>{i18n.t("errorChartTitle")}</Text>
              {pieSummary && (
                <Text style={styles.pieSummary}>
                  {i18n.t("errorPieSummary", {
                    total: pieSummary.total,
                    label: pieSummary.topLabel,
                    percent: pieSummary.percent,
                  })}
                </Text>
              )}
              {errorChartData.length > 0 ? (
                <>
                  <View style={styles.chartWrapper}>
                    <PolarChart
                      data={errorChartData}
                      labelKey="label"
                      valueKey="value"
                      colorKey="color"
                    >
                      <Pie.Chart innerRadius={36} padAngle={1.5}>
                        {({ slice }) => {
                          if (!pieFont) {
                            return <Pie.Slice />;
                          }
                          const total = pieSummary?.total ?? 0;
                          const percent = total
                            ? Math.round((slice.value / total) * 100)
                            : 0;
                          const showLabel = percent >= 4;
                          return (
                            <Pie.Slice>
                              {showLabel ? (
                                <Pie.Label
                                  font={pieFont}
                                  color="white"
                                  text={`${percent}%`}
                                  radiusOffset={0.6}
                                />
                              ) : null}
                            </Pie.Slice>
                          );
                        }}
                      </Pie.Chart>
                    </PolarChart>
                  </View>
                  <View style={styles.chartLegendRow}>
                    {errorChartData.map((item) => (
                        <View key={item.typeKey} style={styles.chartLegendItem}>
                          <View
                            style={[
                              styles.legendDot,
                              { backgroundColor: item.color },
                            ]}
                          />
                          <Text style={styles.legendLabel}>{item.label}</Text>
                          <Text style={styles.legendCount}>{item.value}</Text>
                        </View>
                    ))}
                  </View>
                </>
              ) : (
                <Text style={styles.emptyChart}>{i18n.t("errorChartEmpty")}</Text>
              )}
            </View>
          }
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
  chartSection: {
    paddingVertical: 12,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
    color: "#1f2937",
    marginBottom: 8,
  },
  pieSummary: {
    textAlign: "center",
    color: "#4b5563",
    fontSize: 13,
    marginBottom: 10,
  },
  chartWrapper: {
    height: 260,
  },
  emptyChart: {
    textAlign: "center",
    color: "#6b7280",
  },
  chartLegendRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 12,
    marginTop: 8,
  },
  chartLegendItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9fafb",
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#e5e7eb",
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#ef4444",
  },
  legendLabel: {
    fontSize: 12,
    color: "#374151",
  },
  legendCount: {
    fontSize: 12,
    fontWeight: "600",
    color: "#111827",
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
  typePill: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    fontSize: 12,
    fontWeight: "600",
    marginTop: 6,
    overflow: "hidden",
  },
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
