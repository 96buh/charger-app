import { ChargeSession } from "@/contexts/ChargeHistoryContext";
import { ErrorRecord } from "@/contexts/ErrorLogContext";
import i18n from "@/utils/i18n";

const DAY_MS = 24 * 60 * 60 * 1000;

const random = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

export function generateDemoChargeHistory(now: number = Date.now()): ChargeSession[] {
  const sessions: ChargeSession[] = [];
  const days = 30;

  for (let offset = 0; offset < days; offset++) {
    const dayStart = new Date(now - offset * DAY_MS);
    dayStart.setHours(7, 0, 0, 0);

    const sessionsToday = random(1, 3);
    let startPercent = random(15, 55);

    for (let index = 0; index < sessionsToday; index++) {
      const duration = random(20, 120);
      const gain = random(8, 28);
      const endPercent = Math.min(100, startPercent + gain);
      const startTime = new Date(
        dayStart.getTime() + index * (2.5 * 60 * 60 * 1000) + random(0, 20) * 60000
      );
      const endTime = new Date(startTime.getTime() + duration * 60000);

      sessions.push({
        id: `demo-history-${offset}-${index}`,
        timestamp: endTime.toISOString(),
        durationMin: duration,
        percent: endPercent - startPercent,
        startPercent,
        endPercent,
      });

      startPercent = Math.max(10, Math.min(65, endPercent - random(5, 15)));
    }
  }

  return sessions.sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
}

const DEMO_ERRORS = [
  { typeKey: "rustedCable", reasonKey: "errorReasonRustedCable" },
  { typeKey: "rustedTransformer", reasonKey: "errorReasonRustedTransformer" },
  {
    typeKey: "temperatureAbnormal",
    reasonKey: "errorReasonTemperature",
    makeParams: () => ({ temp: random(58, 68) }),
  },
];

export function generateDemoErrorLogs(now: number = Date.now()): ErrorRecord[] {
  const logs: ErrorRecord[] = [];

  DEMO_ERRORS.forEach((template, index) => {
    const occurrences = random(2, 4);
    for (let i = 0; i < occurrences; i++) {
      const offsetDays = random(0, 9);
      const offsetHours = random(1, 20);
      const timestamp = new Date(
        now - offsetDays * DAY_MS - offsetHours * 60 * 60 * 1000
      );

      const reasonParams = template.makeParams?.();
      const reason = String(
        reasonParams
          ? i18n.t(template.reasonKey, reasonParams)
          : i18n.t(template.reasonKey)
      );
      const type = String(i18n.t(template.typeKey));

      logs.push({
        id: `demo-error-${template.typeKey}-${index}-${i}`,
        timestamp: timestamp.toISOString(),
        reason,
        type,
        reasonKey: template.reasonKey,
        reasonParams,
        typeKey: template.typeKey,
      });
    }
  });

  return logs.sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
}
