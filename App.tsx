import { StatusBar, StyleSheet, useColorScheme, View, Text } from 'react-native';
import {
  SafeAreaProvider,
} from 'react-native-safe-area-context';

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <Text>oiii</Text>
    
    </SafeAreaProvider>
  );
}



const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;
