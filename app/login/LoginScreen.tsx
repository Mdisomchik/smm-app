// app/login/index.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useAuth } from '../_layout'; // Adjust path if needed

const SimpleLoginScreen = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { setIsAuthenticated } = useAuth();
  const router = useRouter();

  const handleLogin = async () => {
    // In a real application, you would authenticate against a backend.
    // For this simple example, we'll just check for a hardcoded username/password.
    if (username === 'testuser' && password === 'password') {
      try {
        await AsyncStorage.setItem('access_token', 'simple-auth-token'); // Simulate storing a token
        setIsAuthenticated(true);
        router.replace('/dashboard/App');
      } catch (error) {
        console.error('Error storing token:', error);
        Alert.alert('Login Error', 'Failed to store login information.');
      }
    } else {
      Alert.alert('Login Failed', 'Invalid username or password.');
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
      <Text style={{ fontSize: 24, marginBottom: 20 }}>Simple Login</Text>
      <TextInput
        style={{ width: '100%', padding: 10, marginBottom: 15, borderWidth: 1, borderColor: 'gray' }}
        placeholder="Username"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
      />
      <TextInput
        style={{ width: '100%', padding: 10, marginBottom: 20, borderWidth: 1, borderColor: 'gray' }}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <Button title="Login" onPress={handleLogin} />
    </View>
  );
};

export default SimpleLoginScreen;