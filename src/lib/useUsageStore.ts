import { create } from "zustand";

export type DailyLog = {
  date: string;
  humanPercent: number;
};

type UsageState = {
  humanPercent: number;
  monthlyPledge: number;
  dailyLogs: DailyLog[];
  logToday: (humanPercent: number) => void;
  setPledge: (n: number) => void;
};

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

function buildMockLogs(): DailyLog[] {
  const mockValues = [85, 72, 88, 65, 78, 91, 80];
  const logs: DailyLog[] = [];

  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    logs.push({
      date: formatDate(date),
      humanPercent: mockValues[6 - i],
    });
  }

  return logs;
}

const mockLogs = buildMockLogs();
const todayLog = mockLogs[mockLogs.length - 1];

export const useUsageStore = create<UsageState>((set) => ({
  humanPercent: todayLog?.humanPercent ?? 80,
  monthlyPledge: 80,
  dailyLogs: mockLogs,

  logToday: (humanPercent) =>
    set((state) => {
      const today = formatDate(new Date());
      const existingIndex = state.dailyLogs.findIndex(
        (log) => log.date === today
      );
      const dailyLogs = [...state.dailyLogs];

      if (existingIndex >= 0) {
        dailyLogs[existingIndex] = { date: today, humanPercent };
      } else {
        dailyLogs.push({ date: today, humanPercent });
      }

      dailyLogs.sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      return { humanPercent, dailyLogs };
    }),

  setPledge: (n) => set({ monthlyPledge: n }),
}));
