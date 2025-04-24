// app/_layout.tsx
import { Slot, useRouter, useSegments } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState, createContext, useContext, useRef } from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';

// Auth context
const AuthContext = createContext<{
  isAuthenticated: boolean;
  setIsAuthenticated: (val: boolean) => void;
} | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkToken = async () => {
      const token = await AsyncStorage.getItem('access_token');
      setIsAuthenticated(!!token);
      setLoading(false);
    };
    checkToken();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, setIsAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};

const RootLayoutNavigator = () => {
  const { isAuthenticated } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const hasNavigated = useRef(false);

  useEffect(() => {
    if (!segments || hasNavigated.current) return;

    const inLoginGroup = segments[0] === 'login';

    if (!isAuthenticated && !inLoginGroup) {
      router.replace('/login/LoginScreen');
      hasNavigated.current = true;
    } else if (isAuthenticated && inLoginGroup) {
      router.replace('/dashboard/App');
      hasNavigated.current = true;
    }
  }, [isAuthenticated, segments]);

  return <Slot />;
};

export default function Layout() {
  return (
    <AuthProvider>
      <RootLayoutNavigator />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
