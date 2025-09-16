import BackgroundFetch from 'react-native-background-fetch';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initialize, requestPermission, readRecords } from 'react-native-health-connect';

export const HEALTH_DATA_STORAGE_KEY = 'bg_health_data';

export type HealthData = {
  calories: number | null;
  steps: number | null;
  heartRate: number | null;
  date: string | null;
  source: string | null;
};

export const onBackgroundFetchEvent = async (taskId: any) => {
  console.log('[BackgroundFetch] event received:', taskId);

  try {
    await initialize();

    await requestPermission([
      { accessType: 'read', recordType: 'ActiveCaloriesBurned' },
      { accessType: 'read', recordType: 'Steps' },
      { accessType: 'read', recordType: 'HeartRate' },
    ]);

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();

    const resultCalBurned = await readRecords('ActiveCaloriesBurned', {
      timeRangeFilter: { operator: 'between', startTime: startOfDay.toISOString(), endTime: endOfDay.toISOString() },
    });
    const resultSteps = await readRecords('Steps', {
      timeRangeFilter: { operator: 'between', startTime: startOfDay.toISOString(), endTime: endOfDay.toISOString() },
    });
    const resultHeartRate = await readRecords('HeartRate', {
      timeRangeFilter: { operator: 'between', startTime: startOfDay.toISOString(), endTime: endOfDay.toISOString() },
    });

    const totalCalories = resultCalBurned.records.length > 0 ? (resultCalBurned.records[0] as any).energy?.inKilocalories ?? null : null;
    const totalSteps = resultSteps.records.length > 0 ? (resultSteps.records[0] as any).count ?? null : null;
    const latestHeartRate = resultHeartRate.records.length > 0 ? (resultHeartRate.records[resultHeartRate.records.length - 1] as any).samples[0]?.beatsPerMinute ?? null : null;
    const record = resultCalBurned.records.length > 0 ? resultCalBurned.records[0] : resultSteps.records.length > 0 ? resultSteps.records[0] : null;
    const recordDate = record?.startTime ? new Date(record.startTime).toLocaleDateString() : null;
    const dataOrigin = record?.metadata?.dataOrigin ?? null;

    const newHealthData: HealthData = {
      calories: totalCalories,
      steps: totalSteps,
      heartRate: latestHeartRate,
      date: recordDate,
      source: dataOrigin,
    };

    const storedDataJSON = await AsyncStorage.getItem(HEALTH_DATA_STORAGE_KEY);
    let storedData = storedDataJSON ? JSON.parse(storedDataJSON) : [];
    storedData.push(newHealthData);

    await AsyncStorage.setItem(HEALTH_DATA_STORAGE_KEY, JSON.stringify(storedData));
    console.log('[BackgroundFetch] Dados de saúde salvos com sucesso:', newHealthData);

  } catch (error) {
    console.error('[BackgroundFetch] Erro ao capturar e salvar dados de saúde:', error);
  }

  BackgroundFetch.finish(taskId);
};

BackgroundFetch.registerHeadlessTask(onBackgroundFetchEvent);

export const loadStoredHealthData = async (): Promise<HealthData[]> => {
  try {
    const storedDataJSON = await AsyncStorage.getItem(HEALTH_DATA_STORAGE_KEY);
    if (storedDataJSON) {
      return JSON.parse(storedDataJSON);
    }
    return [];
  } catch (error) {
    console.error('Erro ao carregar os dados de saúde do AsyncStorage:', error);
    return [];
  }
};