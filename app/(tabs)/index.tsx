import { View, Text, Button, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

export default function MainScreen() {
  const router = useRouter();

  const logout = async () => {
    await AsyncStorage.removeItem('access_token');
    router.replace('/login');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📬 You're Logged In!</Text>
      <Text style={styles.subtitle}>This is your dashboard</Text>
      <Button title="Logout" onPress={logout} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold' },
  subtitle: { fontSize: 16, color: '#666', marginBottom: 20 },
});
