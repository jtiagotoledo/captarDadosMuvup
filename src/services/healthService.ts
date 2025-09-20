import { readRecords } from 'react-native-health-connect';

export interface HealthData {
  date: string;
  steps: { start: string; end: string; count: number }[];
  calories: number | null;
  heartRates: { time: string; bpm: number }[];
}

export async function capturarDados(): Promise<HealthData> {
  const now = new Date();
  const startTime = new Date(Date.now() - 3600 * 1000).toISOString(); // última hora
  const endTime = now.toISOString();

  // Steps → lista
  const stepsResult = await readRecords('Steps', {
    timeRangeFilter: { operator: 'between', startTime, endTime },
  });

  const steps =
    stepsResult.records.map((r) => ({
      start: r.startTime,
      end: r.endTime,
      count: r.count ?? 0,
    })) ?? [];

  // HeartRate → lista
  const hrResult = await readRecords('HeartRate', {
    timeRangeFilter: { operator: 'between', startTime, endTime },
  });

  const heartRates =
    hrResult.records.flatMap((r) =>
      r.samples?.map((s) => ({
        time: s.time ?? r.startTime,
        bpm: s.beatsPerMinute,
      })) ?? []
    ) ?? [];

  // Calories
  let totalCalories: number | null = null;
  try {
    const calResult = await readRecords('ActiveCaloriesBurned', {
      timeRangeFilter: { operator: 'between', startTime, endTime },
    });
    totalCalories =
      calResult.records.length > 0
        ? (calResult.records[0] as any).energy?.inKilocalories ?? null
        : null;
  } catch (err) {
    console.warn('[HealthConnect] Não foi possível ler calorias', err);
  }

  return {
    date: now.toLocaleString(),
    steps,
    calories: totalCalories,
    heartRates,
  };
}
