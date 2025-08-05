import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface ChargeSession {
  /** Unique id for the session */
  id: string;
  /** ISO timestamp when the session completed */
  timestamp: string;
  /** Percentage of battery added during the session (0-100) */
  percent: number;
}

interface ChargeHistoryContextProps {
  history: ChargeSession[];
  addSession: (session: ChargeSession) => void;
}

const STORAGE_KEY = "charge_history";

const ChargeHistoryContext = createContext<
  ChargeHistoryContextProps | undefined
>(undefined);

export const ChargeHistoryProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [history, setHistory] = useState<ChargeSession[]>([]);

  // Load stored sessions on mount
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const stored: unknown = JSON.parse(raw);
          if (Array.isArray(stored)) {
            setHistory(stored as ChargeSession[]);
          }
        }
      } catch (e) {
        console.warn("Failed to load charge history", e);
      }
    })();
  }, []);

  // Persist whenever history changes
  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(history)).catch((e) =>
      console.warn("Failed to save charge history", e)
    );
  }, [history]);

  const addSession = useCallback((session: ChargeSession) => {
    setHistory((prev) => [...prev, session]);
  }, []);

  return (
    <ChargeHistoryContext.Provider value={{ history, addSession }}>
      {children}
    </ChargeHistoryContext.Provider>
  );
};

export function useChargeHistory() {
  const ctx = useContext(ChargeHistoryContext);
  if (ctx === undefined) {
    throw new Error(
      "useChargeHistory must be used within ChargeHistoryProvider"
    );
  }
  return ctx;
}
