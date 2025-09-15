import { StatusBar,  StyleSheet,  useColorScheme,  View,  Text,  Button,  Alert,  ActivityIndicator} from 'react-native';
import { useEffect, useState } from 'react';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {  initialize,  requestPermission,  readRecords} from 'react-native-health-connect';
import BackgroundFetch from 'react-native-background-fetch';
import AsyncStorage from '@react-native-async-storage/async-storage';

type HealthData = {
  calories: number | null;
  steps: number | null;
  heartRate: number | null;
  date: string | null;
  source: string | null;
};

const STORAGE_KEY = 'bg_fetch_times';

const onBackgroundFetchEvent = async (taskId:any) => {
  console.log('[BackgroundFetch] event received:', taskId);

  try {
    const currentTime = new Date().toLocaleString();

    const storedTimesJSON = await AsyncStorage.getItem(STORAGE_KEY);
    let storedTimes = storedTimesJSON ? JSON.parse(storedTimesJSON) : [];

    storedTimes.push(currentTime);
    console.log('[BackgroundFetch] Lista atualizada:', storedTimes);

    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(storedTimes));
    

  } catch (error) {
    console.error('[BackgroundFetch] Erro ao salvar o horário:', error);
  }

  BackgroundFetch.finish(taskId);
};

BackgroundFetch.registerHeadlessTask(onBackgroundFetchEvent);

function App() {
  const isDarkMode = useColorScheme() === 'dark';

   const [_fetchedTimes, setFetchedTimes] = useState([]);

  const loadStoredTimes = async () => {
    try {
      const storedTimesJSON = await AsyncStorage.getItem(STORAGE_KEY);
      if (storedTimesJSON) {
        console.log('dadosArmazenados',JSON.parse(storedTimesJSON));
        
        setFetchedTimes(JSON.parse(storedTimesJSON));
      }
    } catch (error) {
      console.error('Erro ao carregar os dados do AsyncStorage:', error);
    }
  };

  const [healthData, setHealthData] = useState<HealthData>({
    calories: null,
    steps: null,
    heartRate: null,
    date: null,
    source: null,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (healthData.date !== null) {
      console.log('healthData', healthData);
    }
  }, [healthData]);

  const readSampleData = async () => {
    
    setLoading(true);
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
        timeRangeFilter: {
          operator: 'between',
          startTime: startOfDay.toISOString(),
          endTime: endOfDay.toISOString(),
        },
      });

      const resultSteps = await readRecords('Steps', {
        timeRangeFilter: {
          operator: 'between',
          startTime: startOfDay.toISOString(),
          endTime: endOfDay.toISOString(),
        },
      });

      const resultHeartRate = await readRecords('HeartRate', {
        timeRangeFilter: {
          operator: 'between',
          startTime: startOfDay.toISOString(),
          endTime: endOfDay.toISOString(),
        },
      });

      const totalCalories =
        resultCalBurned.records.length > 0
          ? (resultCalBurned.records[0] as any).energy?.inKilocalories ?? null
          : null;
      const totalSteps =
        resultSteps.records.length > 0
          ? (resultSteps.records[0] as any).count ?? null
          : null;
      const latestHeartRate =
        resultHeartRate.records.length > 0
          ? (resultHeartRate.records[resultHeartRate.records.length - 1] as any)
            .samples[0]?.beatsPerMinute ?? null
          : null;

      const record =
        resultCalBurned.records.length > 0
          ? resultCalBurned.records[0]
          : resultSteps.records.length > 0
            ? resultSteps.records[0]
            : null;
      const recordDate = record?.startTime
        ? new Date(record.startTime).toLocaleDateString()
        : null;
      const dataOrigin = record?.metadata?.dataOrigin ?? null;

      setHealthData({
        calories: totalCalories,
        steps: totalSteps,
        heartRate: latestHeartRate,
        date: recordDate,
        source: dataOrigin,
      });
    } catch (error) {
      console.error(error);
      Alert.alert('Erro', 'Ocorreu um erro ao ler os dados.');
      setHealthData({
        calories: null,
        steps: null,
        heartRate: null,
        date: null,
        source: null,
      });
    } finally {
      setLoading(false);
    }

  };

  useEffect(() => {
    loadStoredTimes();
    
    const configureBackgroundFetch = async () => {
      try {
        await BackgroundFetch.configure(
          {
            minimumFetchInterval: 1,
            stopOnTerminate: false,
            startOnBoot: true,
            enableHeadless: true,
          },
          onBackgroundFetchEvent,
          (taskId) => {
            console.warn('[BackgroundFetch] failed to start:', taskId);
          }
        );
        console.log('[BackgroundFetch] Configuração bem-sucedida.');
      } catch (error) {
        console.error('[BackgroundFetch] Falha na configuração:', error);
      }
    };
    configureBackgroundFetch();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <Text style={styles.header}>Health Connect</Text>
      <Text style={styles.subtitle}>Dados de Saúde</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#fff" />
      ) : (
        <View style={styles.dataContainer}>
          <Text style={styles.dateText}>
            Dados de: {healthData.date !== null ? healthData.date : '---'}
          </Text>

          <View style={styles.cardRow}>
            <View style={styles.card}>
              <Icon name="fire" size={30} color="#FF6347" />
              <Text style={styles.cardLabel}>Calorias</Text>
              <Text style={styles.cardValue}>
                {healthData.calories !== null ? `${healthData.calories}` : '--'}
              </Text>
              <Text style={styles.cardUnit}>kcal</Text>
            </View>

            <View style={styles.card}>
              <Icon name="shoe-print" size={30} color="#4682B4" />
              <Text style={styles.cardLabel}>Passos</Text>
              <Text style={styles.cardValue}>
                {healthData.steps !== null ? `${healthData.steps}` : '--'}
              </Text>
              <Text style={styles.cardUnit}>passos</Text>
            </View>
          </View>

          <View style={styles.cardRow}>
            <View style={styles.card}>
              <Icon name="heart-pulse" size={30} color="#DA70D6" />
              <Text style={styles.cardLabel}>Coração</Text>
              <Text style={styles.cardValue}>
                {healthData.heartRate !== null ? `${healthData.heartRate}` : '--'}
              </Text>
              <Text style={styles.cardUnit}>bpm</Text>
            </View>
          </View>

          <Text style={styles.sourceText}>
            Fonte: {healthData.source !== null ? healthData.source : '---'}
          </Text>
        </View>
      )}
      <View style={styles.buttonContainer}>
        <Button onPress={readSampleData} title="Atualizar Dados" color="#2F4F4F" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2E3B4E',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 18,
    color: '#ccc',
    marginBottom: 30,
  },
  dataContainer: {
    width: '100%',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 16,
    color: '#ccc',
    marginBottom: 20,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 15,
  },
  card: {
    backgroundColor: '#394B61',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    width: '45%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardLabel: {
    fontSize: 16,
    color: '#fff',
    marginTop: 5,
  },
  cardValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 5,
  },
  cardUnit: {
    fontSize: 14,
    color: '#ccc',
  },
  sourceText: {
    fontSize: 14,
    color: '#aaa',
    marginTop: 10,
    textAlign: 'center',
  },
  buttonContainer: {
    marginTop: 30,
    width: '80%',
  },
});

export default App;