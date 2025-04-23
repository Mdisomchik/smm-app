import React, { useEffect, useState } from 'react';
import { View, Text, Button, ActivityIndicator, StyleSheet, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [emails, setEmails] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      const accessToken = await AsyncStorage.getItem('access_token');
      if (!accessToken) {
        return router.replace('/login');
      }
      await fetchUserInfo(accessToken);
      await fetchEmails(accessToken);
      setLoading(false);
    };

    fetchData();
  }, []);

  const fetchUserInfo = async (accessToken: string) => {
    const res = await fetch('https://www.googleapis.com/oauth2/v1/userinfo?alt=json', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const user = await res.json();
    setUserInfo(user);
  };

  const fetchEmails = async (accessToken: string) => {
    const res = await fetch(
      'https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=5',
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
    const data = await res.json();
    setEmails(data.messages || []);
  };

  const logout = async () => {
    await AsyncStorage.removeItem('access_token');
    router.replace('/login');
  };

  return (
    <View style={styles.container}>
      {loading && <ActivityIndicator size="large" />}
      {!loading && userInfo && (
        <>
          <Text style={styles.title}>Welcome, {userInfo.name} 👋</Text>
          <Text style={styles.email}>{userInfo.email}</Text>

          <Text style={styles.sectionTitle}>Your Emails:</Text>

          <ScrollView style={styles.emailList}>
            {emails.map((email) => (
              <View key={email.id} style={styles.emailCard}>
                <Text style={styles.subject}>Subject: {email.snippet}</Text>
              </View>
            ))}
          </ScrollView>

          <Button title="Logout" onPress={logout} />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 10 },
  email: { fontSize: 16, marginBottom: 20, color: '#555' },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginTop: 20 },
  emailList: { marginTop: 10 },
  emailCard: {
    backgroundColor: '#f1f1f1',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  subject: { fontWeight: 'bold' },
});
