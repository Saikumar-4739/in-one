import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, StatusBar } from 'react-native';
import HomePage from '../components/homepage';

export default function App() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <View style={styles.header}>
        <Text style={styles.title}>📱 IN-One App</Text>
      </View>

      <View style={styles.content}>
        <HomePage />
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Version 1.0.0</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomColor: '#eee',
    borderBottomWidth: 1,
    backgroundColor: '#f8f8f8',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#8a2be2',
  },
  content: {
    flex: 1,
    padding: 10,
  },
  footer: {
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderTopColor: '#eee',
    borderTopWidth: 1,
    backgroundColor: '#f8f8f8',
  },
  footerText: {
    fontSize: 12,
    color: '#aaa',
  },
});
