import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import FeatureCard from './feature-card';

const features = [
  { name: 'Notes', color: '#ff6b6b' },
  { name: 'News', color: '#4ecdc4' },
  { name: 'Chat', color: '#45b7d1' },
  { name: 'AI Bot', color: '#96ceb4' },
  { name: 'Videos', color: '#8a2be2' },
  { name: 'Photos', color: '#333' },
];

const HomePage = () => {

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Welcome to Your <Text style={styles.highlight}>IN</Text>-One</Text>
        <Text style={styles.subtitle}>
          Discover a seamless experience with powerful features designed to boost productivity and creativity.
        </Text>
        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>Get Started</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.features}>
        {features.map((feature, index) => (
          <FeatureCard key={index} feature={feature} />
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 30,
    backgroundColor: '#fff',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  highlight: {
    color: '#8a2be2',
  },
  subtitle: {
    fontSize: 16,
    color: '#555',
    marginTop: 10,
    textAlign: 'center',
  },
  button: {
    marginTop: 20,
    backgroundColor: '#8a2be2',
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
  features: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 15,
  },
});

export default HomePage;
