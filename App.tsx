import { StatusBar, StyleSheet, useColorScheme, View, Text, Button, Alert, ActivityIndicator, } from 'react-native';
import { useState } from 'react';
import { initialize, requestPermission, readRecords, } from 'react-native-health-connect';

type HealthData = { calories: number | null; date: string | null; source: string | null; };

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  const [healthData, setHealthData] = useState<HealthData>({ calories: null, date: null, source: null, });
  const [loading, setLoading] = useState(false);

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

      console.log('resultSteps',resultSteps);
      console.log('resultHeartRate',resultHeartRate);
      

      /* if (result.records.length > 0) {
        const record = result.records[0];

        const totalCalories = record.energy?.inKilocalories ?? 0;
        const dataOrigin = record.metadata?.dataOrigin ?? null;
        const recordDate = record.startTime
          ? new Date(record.startTime).toLocaleDateString()
          : null;

        setHealthData({
          calories: totalCalories,
          date: recordDate,
          source: dataOrigin,
        });
      } else {
        setHealthData({ calories: 0, date: null, source: null });
        Alert.alert(
          'Nenhum dado encontrado',
          'Não há registro de calorias ativas para hoje.'
        );
      } */
    } catch (error) {
      console.error(error);
      Alert.alert('Erro', 'Ocorreu um erro ao ler os dados.');
      setHealthData({ calories: null, date: null, source: null });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <Text style={styles.header}>Dados - Muvup</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <View style={styles.dataContainer}>
          <Text style={styles.label}>Calorias Ativas:</Text>
          <Text style={styles.valueText}>
            {healthData.calories !== null ? `${healthData.calories} kcal` : '---'}
          </Text>

          <Text style={styles.label}>Data:</Text>
          <Text style={styles.valueText}>
            {healthData.date !== null ? healthData.date : '---'}
          </Text>

          <Text style={styles.label}>Origem dos Dados:</Text>
          <Text style={styles.valueText}>
            {healthData.source !== null ? healthData.source : '---'}
          </Text>
        </View>
      )}
      <Button onPress={readSampleData} title="Capturar Dados" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  dataContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: '#555',
    marginTop: 15,
  },
  valueText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'green',
  },
});

export default App;