// app/dashboard/index.tsx
import React from 'react';
import { View, Text, StyleSheet, Button, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../_layout'; // Adjust path if needed
import AsyncStorage from '@react-native-async-storage/async-storage';

const DashboardScreen = () => {
  const router = useRouter();
  const { setIsAuthenticated } = useAuth();

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('access_token');
      setIsAuthenticated(false);
      router.replace('/login/LoginScreen');
    } catch (error) {
      console.error('Error logging out:', error);
      Alert.alert('Logout Error', 'Failed to logout.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to the Dashboard!</Text>
      <Text style={styles.subtitle}>This is your main application area.</Text>

      <View style={styles.featureCard}>
        <Text style={styles.featureTitle}>Check Your Emails</Text>
       <Button title="Go to Emails" onPress={() => router.push} />
      </View>

      <View style={styles.featureCard}>
        <Text style={styles.featureTitle}>Manage Profile</Text>
        <Button title="Edit Profile" onPress={() => router.push} />
      </View>

      <Button title="Logout" onPress={handleLogout} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f4f4f4',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    marginBottom: 30,
    textAlign: 'center',
  },
  featureCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 20,
    marginBottom: 20,
    width: '90%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  featureTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
});

export default DashboardScreen;