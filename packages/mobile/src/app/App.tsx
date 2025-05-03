import React from 'react';
import { SafeAreaView, StatusBar, Text, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../components/authentication/login-page';
import AppLayout from 'mobile-layout/mobile--layout';

// Define navigation stack param list
type RootStackParamList = {
  Login: undefined;
  Home: undefined;
};

// Create stack navigator
const Stack = createNativeStackNavigator<RootStackParamList>();

const App: React.FC = () => {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={{ flex: 1, padding: 10 }}>
        <NavigationContainer>
          <Stack.Navigator initialRouteName="Login">
            <Stack.Screen
              name="Login"
              component={LoginScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="Home"
              component={AppLayout}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </View>
    </SafeAreaView>
  );
};

export default App;