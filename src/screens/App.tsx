import { StatusBar, StyleSheet, useColorScheme, View, Text, Image, TouchableOpacity, ScrollView, ActivityIndicator, Alert, } from 'react-native';
import { useEffect, useState } from 'react';
import { initialize, requestPermission } from 'react-native-health-connect';
import { capturarDados, HealthData } from '../services/healthService';

function App() {
  const isDarkMode = useColorScheme() === 'dark';
  const [healthData, setHealthData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  // Inicializa Health Connect e pede permissões
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

  // Captura dados do Health Connect
  const handleCapturar = async () => {
    try {
      setLoading(true);
      const data = await capturarDados();
      console.log('dadosCapturados', data);
      setHealthData(data);
    } catch (err) {
      console.error('[App] Erro ao capturar:', err);
    } finally {
      setLoading(false);
    }
  };

  // Envia dados para Netlify Function
  const handleEnviar = async () => {
    if (!healthData) {
      Alert.alert('Primeiro capture os dados!');
      return;
    }

    try {
      setSending(true);
      const response = await fetch(
        "https://muvup.netlify.app/.netlify/functions/capture",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(healthData),
        }
      );

      const result = await response.json();
      console.log("✅ Resposta da Function:", result);
      Alert.alert('Dados enviados com sucesso!');
    } catch (err) {
      console.error("❌ Erro ao enviar dados:", err);
      Alert.alert('Erro ao enviar dados');
    } finally {
      setSending(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />

      <Image
        source={require('../images/logo.png')}
        style={styles.logo}
        resizeMode="contain"
      />

      <Text style={styles.header}>Muvup Connect</Text>
      <Text style={styles.subtitle}>Captura manual diária</Text>

      <TouchableOpacity style={styles.button} onPress={handleCapturar}>
        <Text style={styles.buttonText}>Capturar dados de saúde</Text>
      </TouchableOpacity>

      {loading && <ActivityIndicator style={styles.loader} size="large" color="#fff" />}

      {healthData && (
        <ScrollView style={styles.resultBox}>
          <Text style={styles.itemTitle}>Data: {healthData.date}</Text>

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
          <Text style={styles.sectionTitle}></Text>
        </ScrollView>
      )}

      <TouchableOpacity
        style={styles.button}
        onPress={handleEnviar}
        disabled={sending}
      >
        <Text style={styles.buttonText}>
          {sending ? 'Enviando...' : 'Enviar dados ao site'}
        </Text>
      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#8F6DA0',
    padding: 20,
  },
  logo: {
    width: 120,
    height: 120,
    alignSelf: 'center',
    marginBottom: 10,
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#ccc',
    textAlign: 'center',
    marginBottom: 20,
  },
  loader: {
    marginTop: 20,
  },
  resultBox: {
    flex: 1,
    backgroundColor: '#394B61',
    borderRadius: 10,
    padding: 15,
    marginTop: 20,
  },
  itemTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ddd',
    marginTop: 10,
    marginBottom: 5,
  },
  itemText: {
    fontSize: 14,
    color: '#eee',
    marginBottom: 2,
  },
  button: {
    backgroundColor: '#394B61',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default App;
