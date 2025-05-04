import React from 'react';
import { Platform, SafeAreaView, StatusBar, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from './components/authentication/login-page';
import WebLoginScreen from './components/authentication/web-login-page';
import AppLayout from './mobile-layout/mobile--layout';

// Define navigation stack param list
type RootStackParamList = {
  Login: undefined;
  Home: undefined;
};

// Create stack navigator
const Stack = createNativeStackNavigator<RootStackParamList>();

// Error boundary to catch rendering errors
class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text>Something went wrong: {this.state.error?.toString()}</Text>
        </SafeAreaView>
      );
    }
    return this.props.children;
  }
}

const App: React.FC = () => {
  // Use WebLoginScreen for web, LoginScreen for native
  const LoginComponent = Platform.OS === 'web' ? WebLoginScreen : LoginScreen;

  return (
    <ErrorBoundary>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <NavigationContainer>
          <Stack.Navigator initialRouteName="Login">
            <Stack.Screen
              name="Login"
              component={LoginComponent}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="Home"
              component={AppLayout}
              options={{ headerShown: false }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaView>
    </ErrorBoundary>
  );
};

export default App;