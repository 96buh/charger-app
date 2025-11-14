import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { isSupabaseConfigured } from "@/utils/supabaseClient";
import {
  deleteAlerts,
  fetchAlerts,
  subscribeAlerts,
  type SupabaseAlertRow,
} from "@/utils/supabaseAlerts";

export interface ErrorRecord {
  id: string;
  timestamp: string; // ISO string
  reason: string;
  type: string;
  reasonKey?: string;
  reasonParams?: Record<string, unknown>;
  typeKey?: string;
  source?: "local" | "supabase";
  remoteId?: number;
  predicted?: number;
  rawSequence?: any;
}

interface ErrorLogContextProps {
  logs: ErrorRecord[];
  addLog: (record: ErrorRecord) => void;
  removeLogs: (ids: string[]) => void;
  replaceLogs: (records: ErrorRecord[]) => void;
}

const STORAGE_KEY = "error_logs";

const PREDICTION_LABELS: Record<
  number,
  { label: string; key: string }
> = {
  0: { label: "正常", key: "normal" },
  1: { label: "充電線生鏽", key: "rustedCable" },
  2: { label: "變壓器生鏽", key: "rustedTransformer" },
};

const ErrorLogContext = createContext<ErrorLogContextProps | undefined>(
  undefined
);

const sortByTimestampDesc = (records: ErrorRecord[]) =>
  [...records].sort(
    (a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

const mapSupabaseRowToRecord = (row: SupabaseAlertRow): ErrorRecord => {
  const info = PREDICTION_LABELS[row.predicted] ?? {
    label: "未知",
    key: "unknown",
  };
  const createdAt =
    row.created_at ?? new Date(Number(row.timestamp) || Date.now()).toISOString();
  const supabaseId =
    row.id ?? Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
  return {
    id: `supabase-${supabaseId}`,
    timestamp: createdAt,
    reason: info.label,
    type: info.label,
    reasonKey: info.key,
    reasonParams: {
      remoteTimestamp: row.timestamp,
    },
    typeKey: info.key,
    source: "supabase",
    remoteId: row.id,
    predicted: row.predicted,
    rawSequence: row.sequencer,
  };
};

export const ErrorLogProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [localLogs, setLocalLogs] = useState<ErrorRecord[]>([]);
  const [remoteLogs, setRemoteLogs] = useState<ErrorRecord[]>([]);

  // Load existing logs on mount
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed: unknown = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            setLocalLogs(
              (parsed as any[]).map((l) => ({
                id: l.id,
                timestamp: l.timestamp,
                reason: l.reason,
                type: l.type ?? l.reason,
                reasonKey: l.reasonKey,
                reasonParams: l.reasonParams,
                typeKey: l.typeKey,
                source: "local",
              }))
            );
          }
        }
      } catch (e) {
        console.warn("Failed to load error logs", e);
      }
    })();
  }, []);

  // Persist logs whenever they change
  useEffect(() => {
    if (localLogs.length > 0) {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(localLogs)).catch((e) =>
        console.warn("Failed to save error logs", e)
      );
    } else {
      AsyncStorage.removeItem(STORAGE_KEY).catch((e) =>
        console.warn("Failed to clear error logs", e)
      );
    }
  }, [localLogs]);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setRemoteLogs([]);
      return;
    }

    let isMounted = true;
    let unsubscribe = () => undefined;

    (async () => {
      try {
        const rows = await fetchAlerts();
        if (!isMounted) return;
        setRemoteLogs(sortByTimestampDesc(rows.map(mapSupabaseRowToRecord)));
      } catch (err) {
        console.warn("[Supabase] Failed to fetch alerts", err);
      }

      unsubscribe = subscribeAlerts((row) => {
        setRemoteLogs((prev) => {
          const mapped = mapSupabaseRowToRecord(row);
          const filtered = prev.filter((log) => log.id !== mapped.id);
          return sortByTimestampDesc([mapped, ...filtered]);
        });
      });
    })();

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const logs = useMemo(
    () => sortByTimestampDesc([...remoteLogs, ...localLogs]),
    [remoteLogs, localLogs]
  );

  const addLog = useCallback((record: ErrorRecord) => {
    const normalized: ErrorRecord = {
      ...record,
      reason: record.reason ?? record.reasonKey ?? "",
      type: record.type ?? record.typeKey ?? record.reason ?? "",
      source: "local",
      id: record.id ?? Date.now().toString(),
    };
    setLocalLogs((prev) => [...prev, normalized]);
  }, []);

  const removeLogs = useCallback((ids: string[]) => {
    if (ids.length === 0) return;

    setLocalLogs((prev) => prev.filter((r) => !ids.includes(r.id)));

    const remoteIdsToDelete: number[] = [];
    setRemoteLogs((prev) =>
      prev.filter((r) => {
        if (ids.includes(r.id)) {
          if (typeof r.remoteId === "number") {
            remoteIdsToDelete.push(r.remoteId);
          }
          return false;
        }
        return true;
      })
    );

    if (remoteIdsToDelete.length > 0) {
      deleteAlerts(remoteIdsToDelete).catch((err) =>
        console.warn("[Supabase] Failed to delete alerts", err)
      );
    }
  }, []);

  const replaceLogs = useCallback((records: ErrorRecord[]) => {
    setLocalLogs(records.map((r) => ({ ...r, source: "local" })));
  }, []);

  return (
    <ErrorLogContext.Provider
      value={{ logs, addLog, removeLogs, replaceLogs }}
    >
      {children}
    </ErrorLogContext.Provider>
  );
};

export function useErrorLog() {
  const ctx = useContext(ErrorLogContext);
  if (!ctx) {
    throw new Error("useErrorLog must be used within ErrorLogProvider");
  }
  return ctx;
}
