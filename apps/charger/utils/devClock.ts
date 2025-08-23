import { useCallback, useMemo, useState } from "react";

export const DAY_MS = 24 * 60 * 60 * 1000;

/** 測試用「開發時鐘」：用 offsetDays 把現在時間往前/後挪動 */
export function useDevClock(initialOffsetDays = 0) {
  const [offsetDays, setOffsetDays] = useState(initialOffsetDays);

  // 模擬的「現在」時間（毫秒）
  const nowMs = useMemo(() => Date.now() + offsetDays * DAY_MS, [offsetDays]);

  const shiftDays = useCallback((d: number) => {
    setOffsetDays((prev) => prev + d);
  }, []);

  const setDays = useCallback((d: number) => {
    setOffsetDays(d);
  }, []);

  const reset = useCallback(() => setOffsetDays(0), []);

  return { nowMs, offsetDays, shiftDays, setDays, reset };
}
