/**
 * @format
 */

import { AppRegistry } from 'react-native';
import App from './src/screens/App';
import { name as appName } from './app.json';
import './src/utils/background'; 

AppRegistry.registerComponent(appName, () => App);
