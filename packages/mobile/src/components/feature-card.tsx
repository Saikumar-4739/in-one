import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface Feature {
  name: string;
  color: string;
}

interface FeatureCardProps {
  feature: Feature;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ feature }) => {

  return (
    <TouchableOpacity style={[styles.card, { backgroundColor: feature.color }]}>
      <View style={styles.circle} />
      <Text style={styles.text}>{feature.name}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: 100,
    height: 100,
    borderRadius: 12,
    margin: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circle: {
    width: 40,
    height: 40,
    backgroundColor: '#fff',
    borderRadius: 20,
    marginBottom: 8,
  },
  text: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default FeatureCard;
