import React, { useState } from 'react';
import { View, Text, Button, ActivityIndicator, ScrollView, StyleSheet } from 'react-native';
import * as AuthSession from 'expo-auth-session';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { googleAuthConfig } from '../../config/authConfig';

export default function LoginScreen() {
  const [userInfo, setUserInfo] = useState<any>(null);
  const [emails, setEmails] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const redirectUri = AuthSession.makeRedirectUri({ useProxy: true });


  const handleGoogleLogin = async () => {
    setLoading(true);

    const request = new AuthSession.AuthRequest({
      clientId: googleAuthConfig.androidClientId,
      scopes: googleAuthConfig.scopes,
      redirectUri,
    });

    const discovery = {
      authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenEndpoint: 'https://oauth2.googleapis.com/token',
    };

    await request.makeAuthUrlAsync(discovery);

    const result = await request.promptAsync(discovery);

    if (result.type === 'success' && result.authentication?.accessToken) {
      const accessToken = result.authentication.accessToken;

      await AsyncStorage.setItem('access_token', accessToken);
      await fetchUserInfo(accessToken);
      await showEmails(accessToken);

      router.replace('/(tabs)/explore'); // Redirect to tab/home
    } else {
      console.log('Login canceled or failed:', result);
    }

    setLoading(false);
  };

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
    return data.messages || [];
  };

  const fetchEmailDetails = async (id: string, accessToken: string) => {
    const res = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}?format=metadata&metadataHeaders=Subject`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
    const message = await res.json();
    const subjectHeader = message.payload.headers.find((h: any) => h.name === 'Subject');
    return {
      id: message.id,
      subject: subjectHeader ? subjectHeader.value : '(No Subject)',
      snippet: message.snippet,
    };
  };

  const showEmails = async (accessToken: string) => {
    const ids = await fetchEmails(accessToken);
    const detailed = await Promise.all(
      ids.map((msg: { id: string }) => fetchEmailDetails(msg.id, accessToken))
    );
    setEmails(detailed);
  };

  return (
    <View style={styles.container}>
      {loading && <ActivityIndicator size="large" />}
      {!userInfo && !loading && (
        <Button title="Sign in with Google" onPress={handleGoogleLogin} />
      )}
      {userInfo && (
        <ScrollView>
          <Text style={styles.text}>Welcome {userInfo.name} 👋</Text>
          <Text style={styles.email}>{userInfo.email}</Text>
          <Text style={styles.sectionTitle}>Your Emails:</Text>
          {emails.map((email) => (
            <View key={email.id} style={styles.emailCard}>
              <Text style={styles.subject}>{email.subject}</Text>
              <Text style={styles.snippet}>{email.snippet}</Text>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 60 },
  text: { fontSize: 20, fontWeight: 'bold', marginBottom: 4 },
  email: { fontSize: 14, marginBottom: 10, color: '#555' },
  sectionTitle: { marginTop: 20, fontSize: 16, fontWeight: '600' },
  emailCard: {
    backgroundColor: '#f1f1f1',
    borderRadius: 10,
    padding: 10,
    marginVertical: 6,
  },
  subject: { fontWeight: 'bold', fontSize: 15 },
  snippet: { fontSize: 13, color: '#444' },
});
