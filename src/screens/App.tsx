import { StatusBar, StyleSheet, useColorScheme, View, Text, Button, ScrollView, ActivityIndicator } from 'react-native';
import { useEffect, useState } from 'react';
import { initialize, requestPermission } from 'react-native-health-connect';
import { capturarDados, HealthData } from '../services/healthService';

function App() {
  const isDarkMode = useColorScheme() === 'dark';
  const [healthData, setHealthData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(false);

  // Pede permissões na abertura do app
  useEffect(() => {
    const init = async () => {
      try {
        await initialize();
        await requestPermission([
          { accessType: 'read', recordType: 'ActiveCaloriesBurned' },
          { accessType: 'read', recordType: 'Steps' },
          { accessType: 'read', recordType: 'HeartRate' },
        ]);
        console.log('[App] Permissões concedidas');
      } catch (err) {
        console.error('[App] Erro ao inicializar/permissões:', err);
      }
    };
    init();
  }, []);

  // Captura os dados ao clicar
  const handleCapturar = async () => {
    try {
      setLoading(true);
      const data = await capturarDados();
      console.log('dadosCapturados',data);
      
      setHealthData(data);
    } catch (err) {
      console.error('[App] Erro ao capturar:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <Text style={styles.header}>Health Connect</Text>
      <Text style={styles.subtitle}>Captura manual diária</Text>

      <Button title="📊 Capturar dados de saúde" onPress={handleCapturar} />

      {loading && <ActivityIndicator style={styles.loader} size="large" color="#fff" />}

      {healthData && (
        <ScrollView style={styles.resultBox}>
          <Text style={styles.itemTitle}>📅 Data: {healthData.date}</Text>

          <Text style={styles.sectionTitle}>🔥 Calorias:</Text>
          <Text style={styles.itemText}>{healthData.calories ?? '--'}</Text>

          <Text style={styles.sectionTitle}>🚶‍♂️ Passos:</Text>
          {healthData.steps.length ? (
            healthData.steps.map((s, idx) => (
              <Text key={idx} style={styles.itemText}>
                {new Date(s.start).toLocaleTimeString()} → {new Date(s.end).toLocaleTimeString()}: {s.count}
              </Text>
            ))
          ) : (
            <Text style={styles.itemText}>--</Text>
          )}

          <Text style={styles.sectionTitle}>💓 Batimentos:</Text>
          {healthData.heartRates.length ? (
            healthData.heartRates.map((hr, idx) => (
              <Text key={idx} style={styles.itemText}>
                {new Date(hr.time).toLocaleTimeString()} → {hr.bpm} bpm
              </Text>
            ))
          ) : (
            <Text style={styles.itemText}>--</Text>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#2E3B4E', padding: 20 },
  header: { fontSize: 28, fontWeight: 'bold', color: '#fff', textAlign: 'center', marginBottom: 5 },
  subtitle: { fontSize: 16, color: '#ccc', textAlign: 'center', marginBottom: 20 },
  loader: { marginTop: 20 },
  resultBox: { backgroundColor: '#394B61', borderRadius: 10, padding: 15, marginTop: 20 },
  itemTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff', marginBottom: 10 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#ddd', marginTop: 10, marginBottom: 5 },
  itemText: { fontSize: 14, color: '#eee', marginBottom: 2 },
});

export default App;
