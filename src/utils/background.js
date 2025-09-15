import BackgroundFetch from 'react-native-background-fetch';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'bg_fetch_times';

// Esta é a mesma função que você já tem
const onBackgroundFetchEvent = async (taskId) => {
  console.log('[BackgroundFetch] event received:', taskId);

  try {
    const currentTime = new Date().toLocaleString();
    const storedTimesJSON = await AsyncStorage.getItem(STORAGE_KEY);
    let storedTimes = storedTimesJSON ? JSON.parse(storedTimesJSON) : [];
    storedTimes.push(currentTime);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(storedTimes));
    console.log('[BackgroundFetch] Tempo salvo em modo headless!');
  } catch (error) {
    console.error('[BackgroundFetch] Erro no modo headless:', error);
  }

  BackgroundFetch.finish(taskId);
};

// Registre a tarefa headless
BackgroundFetch.registerHeadlessTask(onBackgroundFetchEvent);