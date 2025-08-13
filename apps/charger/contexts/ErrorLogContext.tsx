import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface ErrorRecord {
  id: string;
  timestamp: string; // ISO string
  reason: string;
}

interface ErrorLogContextProps {
  logs: ErrorRecord[];
  addLog: (record: ErrorRecord) => void;
  removeLogs: (ids: string[]) => void;
}

const STORAGE_KEY = "error_logs";

const ErrorLogContext = createContext<ErrorLogContextProps | undefined>(
  undefined
);

export const ErrorLogProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [logs, setLogs] = useState<ErrorRecord[]>([]);

  // Load existing logs on mount
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed: unknown = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            setLogs(parsed as ErrorRecord[]);
          }
        }
      } catch (e) {
        console.warn("Failed to load error logs", e);
      }
    })();
  }, []);

  // Persist logs whenever they change
  useEffect(() => {
    if (logs.length > 0) {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(logs)).catch((e) =>
        console.warn("Failed to save error logs", e)
      );
    } else {
      AsyncStorage.removeItem(STORAGE_KEY).catch((e) =>
        console.warn("Failed to clear error logs", e)
      );
    }
  }, [logs]);

  const addLog = useCallback((record: ErrorRecord) => {
    setLogs((prev) => [...prev, record]);
  }, []);

  const removeLogs = useCallback((ids: string[]) => {
    setLogs((prev) => prev.filter((r) => !ids.includes(r.id)));
  }, []);

  return (
    <ErrorLogContext.Provider value={{ logs, addLog, removeLogs }}>
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
